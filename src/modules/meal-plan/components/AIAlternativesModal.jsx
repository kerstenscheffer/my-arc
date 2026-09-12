// src/modules/meal-plan/components/AIAlternativesModal.jsx
// 🎯 v2.0 - Clean swap modal with smart suggestions & compare
// Props IDENTIEK: { isOpen, onClose, currentMeal, onSelectMeal, db, service }
import React, { useState, useEffect } from 'react'
import MealCard from './day-schedule/MealCard'
import Keuze from './Keuze'
import { foodImageFallback } from '../foodImageFallback'
// Hetzelfde blad als de historie in het workout-log-scherm; één vorm voor
// "extra scherm dat vanaf onderen openschuift" in de hele app.
import BladModal from '../../workout/components/todays-workout/components/BladModal'
import { X, Search, Check, ArrowUp, ArrowDown, Minus, Star, Plus, Info } from 'lucide-react'

// De coach bewaart zijn vervangers per slot ('breakfast', 'avondsnack',
// 'snack2', …). Voor de keuzelijst vertalen we die naar de zes momenten.
function slotNaarMoment(slot) {
  const v = String(slot || '').toLowerCase()
  if (v.includes('breakfast') || v.includes('ontbijt')) return 'breakfast'
  if (v.includes('lunch')) return 'lunch'
  if (v.includes('dinner') || v.includes('diner') || v.includes('avondeten')) return 'dinner'
  if (v.includes('pre')) return 'pre_workout'
  if (v.includes('post')) return 'post_workout'
  return 'snack'
}

export default function AIAlternativesModal({
  // Opent het maaltijd-aanmaakscherm (Mijn maaltijden in het log-venster).
  onMaaltijdAanmaken,
  isOpen,
  onClose,
  currentMeal,
  onSelectMeal,
  db,
  service,
  client
}) {
  const isMobile = window.innerWidth <= 768
  const [searchTerm, setSearchTerm] = useState('')
  // Drie keuzes in plaats van één rij chips: welk moment, waar zoeken, en de
  // volgorde. De eerste twee snijden de lijst bij, de derde bepaalt alleen de
  // volgorde — daarom is die er één en geen meervoud.
  const [moment, setMoment] = useState('alles')
  const [bron, setBron] = useState('alles')
  const [sortering, setSortering] = useState('smart')
  const [alternatives, setAlternatives] = useState([])
  const [allMeals, setAllMeals] = useState([])
  const [customMeals, setCustomMeals] = useState([])
  const [coachOptions, setCoachOptions] = useState([]) // door coach gecureerde swaps voor dit slot
  // Alle coach-lijsten, per moment. De coach kiest zijn vervangers per slot,
  // dus "Coach-suggesties + Lunch" hoort zijn lunch-lijst te tonen — niet de
  // lijst van het slot dat je toevallig wisselt, gefilterd op timing.
  const [coachPerMoment, setCoachPerMoment] = useState({})
  // Maaltijd die naar "Mijn maaltijden" gaat; het blad vraagt eerst bij welk
  // moment hij hoort.
  const [sterMeal, setSterMeal] = useState(null)
  const [sterBezig, setSterBezig] = useState(false)
  // Maaltijd waarvan het info-blad open staat, met zijn uitgeschreven
  // ingrediënten (die zijn in ai_meals alleen verwijzingen).
  const [infoMeal, setInfoMeal] = useState(null)
  const [infoIngredienten, setInfoIngredienten] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedMeal, setSelectedMeal] = useState(null)

  // Slot van de huidige maaltijd → naar de 4 curatie-slots (snack1/2/3 → snack).
  const slotKey = (() => {
    const v = String(currentMeal?.slot || currentMeal?.timeSlot || currentMeal?.timing?.[0] || '').toLowerCase()
    if (v.includes('breakfast') || v.includes('ontbijt')) return 'breakfast'
    if (v.includes('lunch')) return 'lunch'
    if (v.includes('dinner') || v.includes('diner')) return 'dinner'
    return 'snack'
  })()

  const momentOpties = [
    { id: 'alles', label: 'Alle maaltijden' },
    { id: 'breakfast', label: 'Ontbijt' },
    { id: 'lunch', label: 'Lunch' },
    { id: 'dinner', label: 'Diner' },
    { id: 'snack', label: 'Snack' },
    { id: 'pre_workout', label: 'Pre-workout' },
    { id: 'post_workout', label: 'Post-workout' },
  ]

  const bronOpties = [
    { id: 'alles', label: 'Overal zoeken' },
    ...(coachOptions.length > 0 ? [{ id: 'coach', label: 'Coach-suggesties' }] : []),
    ...(customMeals.length > 0 ? [{ id: 'mine', label: 'Mijn maaltijden' }] : []),
    { id: 'db', label: 'Maaltijden-database' },
  ]

  const sorteerOpties = [
    { id: 'smart', label: 'Beste match' },
    { id: 'same-cal', label: 'Zelfde kcal' },
    { id: 'more-cal', label: 'Meer kcal' },
    { id: 'less-cal', label: 'Minder kcal' },
    { id: 'same-protein', label: 'Zelfde eiwit' },
    { id: 'more-protein', label: 'Meer eiwit' },
    { id: 'less-protein', label: 'Minder eiwit' },
  ]

  useEffect(() => {
    if (isOpen && currentMeal) {
      loadAlternatives()
    }
    return () => {
      setSelectedMeal(null)
      setSearchTerm('')
      setMoment('alles')
      setBron('alles')
      setSortering('smart')
    }
  }, [isOpen, currentMeal])

  const loadAlternatives = async () => {
    setLoading(true)
    try {
      const smartAlts = await service.getSmartAlternatives(
        currentMeal,
        currentMeal.slot || currentMeal.timeSlot
      )
      
      // Favorieten worden hier niet meer opgehaald: dat filter is vervangen
      // door de drie keuzelijsten, en de query kostte een ronde naar de
      // database zonder dat er nog iets mee gebeurde.

      // Pool voor de handmatige filters (Zelfde kcal / Meer eiwit / Minder
      // kcal / Alles). Twee dingen aangepast:
      //
      // - needs_review eruit, om dezelfde reden als in getSmartAlternatives:
      //   bij die maaltijden loopt de opgegeven kcal uit de pas met hun
      //   ingrediënten, en juist deze filters beloven een kcal-vergelijking.
      // - De .limit(200) is weg. Die kapte 482 maaltijden af zonder ORDER BY,
      //   dus "Zelfde kcal" sorteerde een willekeurige greep op kcal en zei
      //   daar "beste match" bij.
      const { data: meals } = await db.supabase
        .from('ai_meals')
        .select('*')
        .gt('calories', 0)
        .or('needs_review.is.null,needs_review.eq.false')

      // Door de coach gecureerde swaps voor dit slot.
      // Via get_effective_swap_options i.p.v. rechtstreeks client_swap_options:
      // die RPC past de laag eronder toe — heeft de coach niets voor DEZE klant
      // ingesteld, dan gelden zijn standaard-swaps (coach_swap_defaults). Zo
      // hoeft de fallback niet apart in deze modal, de PDF-export én de
      // coach-modal geïmplementeerd te staan.
      let curated = []
      let perMoment = {}
      try {
        const clientId = client?.id || currentMeal?.client_id || null
        let alleSlots = {}
        if (clientId) {
          const { data } = await db.supabase
            .rpc('get_effective_swap_options', { p_client_id: clientId })
          alleSlots = data || {}
        }
        // Alle id's uit álle slots in één keer ophalen: de coach heeft ook
        // lijsten voor de andere momenten en die wil je kunnen kiezen.
        const alleIds = [...new Set(
          Object.values(alleSlots).flatMap(v => v?.meal_ids || [])
        )]
        if (alleIds.length > 0) {
          const { data: curatedMeals } = await db.supabase.from('ai_meals').select('*').in('id', alleIds)
          const opId = new Map((curatedMeals || []).map(m => [m.id, m]))
          // Behoud per slot de volgorde waarin de coach ze koos.
          Object.entries(alleSlots).forEach(([slot, v]) => {
            const lijst = (v?.meal_ids || []).map(id => opId.get(id)).filter(Boolean)
            if (lijst.length === 0) return
            const moment = slotNaarMoment(slot)
            perMoment[moment] = [...(perMoment[moment] || []), ...lijst]
          })
          curated = (alleSlots?.[slotKey]?.meal_ids || []).map(id => opId.get(id)).filter(Boolean)
        }
      } catch (e) { /* geen curatie → gewoon de normale pool */ }

      // Eigen maaltijden van de klant (ai_custom_meals), zodat je ook daarnaar
      // kunt wisselen. getMealById ondersteunt al custom-meal-IDs.
      let custom = []
      try {
        const clientId = client?.id
        if (clientId) {
          const { data: customData } = await db.supabase
            .from('ai_custom_meals')
            .select('id, name, calories, protein, carbs, fat, image_url, section')
            .eq('client_id', clientId)
            .eq('is_active', true)
          custom = (customData || []).map(m => ({ ...m, _isCustom: true }))
        }
      } catch {}

      setAlternatives(smartAlts || [])
      setAllMeals(meals || [])
      setCustomMeals(custom)
      setCoachOptions(curated)
      setCoachPerMoment(perMoment)
      // Wissel je een ontbijt, dan wil je bijna altijd een ander ontbijt zien.
      // "Alle maaltijden" is één tik weg.
      setMoment(slotKey)
      // Heeft de coach opties ingesteld voor dit slot? Toon die als eerste.
      if (curated.length > 0) setBron('coach')
    } catch (error) {
      console.error('Failed to load alternatives:', error)
    } finally {
      setLoading(false)
    }
  }

  // Hoort een maaltijd bij het gekozen moment? ai_meals heeft `timing` als
  // lijst (breakfast/lunch/dinner/snack/pre_workout/…), eigen maaltijden
  // hebben één `section` die soms Nederlands is ("ontbijt", "diner").
  const SECTIE_NAAR_MOMENT = {
    ontbijt: 'breakfast', lunch: 'lunch', diner: 'dinner', avondeten: 'dinner',
    snack: 'snack', tussendoortje: 'snack',
  }
  const momentenVan = (m) => {
    const uit = new Set()
    ;(Array.isArray(m?.timing) ? m.timing : []).forEach(t => uit.add(String(t).toLowerCase()))
    if (m?.section) {
      const s = String(m.section).toLowerCase()
      uit.add(SECTIE_NAAR_MOMENT[s] || s)
    }
    if (m?.slot) uit.add(String(m.slot).toLowerCase())
    return uit
  }

  const getFilteredMeals = () => {
    const currentCal = currentMeal?.calories || 0
    const currentProt = currentMeal?.protein || 0
    const nietZelf = (m) => m.id !== currentMeal?.id

    // 1. Waar zoeken we?
    let pool
    if (bron === 'coach') {
      // Kies je een moment, dan zie je de lijst die de coach voor dát moment
      // heeft gezet. Zonder moment: eerst de lijst van het slot dat je
      // wisselt, daarna de rest.
      if (moment !== 'alles') {
        pool = (coachPerMoment[moment] || []).filter(nietZelf)
      } else {
        const gezien = new Set()
        pool = [...coachOptions, ...Object.values(coachPerMoment).flat()].filter(m => {
          if (!nietZelf(m) || gezien.has(m.id)) return false
          gezien.add(m.id)
          return true
        })
      }
    }
    else if (bron === 'mine') pool = customMeals.filter(nietZelf)
    else if (bron === 'db') pool = allMeals.filter(nietZelf)
    else {
      // Overal: coach eerst, dan eigen maaltijden, dan de database. Dubbele
      // id's eruit, want een coach-optie komt ook in de database voor.
      const gezien = new Set()
      pool = [...coachOptions, ...customMeals, ...allMeals].filter(m => {
        if (!nietZelf(m) || gezien.has(m.id)) return false
        gezien.add(m.id)
        return true
      })
    }

    // 2. Zoekterm gaat vóór het moment-filter: typ je een naam, dan wil je
    // 'm vinden, ook als die bij een ander moment hoort.
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      return pool.filter(m =>
        m.name?.toLowerCase().includes(term) ||
        m.name_en?.toLowerCase().includes(term)
      )
    }

    // 3. Welk moment? Maaltijden zonder moment blijven staan — 19 van de 482
    // hebben geen timing, en die wegfilteren maakt ze onvindbaar.
    // Coach-lijsten zijn al per moment gekozen; er nog eens de timing van de
    // maaltijd overheen leggen zou precies de suggesties wegfilteren die de
    // coach bewust op die plek zette.
    let meals = pool
    if (moment !== 'alles' && bron !== 'coach') {
      meals = pool.filter(m => {
        const set = momentenVan(m)
        return set.size === 0 || set.has(moment)
      })
    }

    // 4. Volgorde.
    const opCal = (m) => m.calories || 0
    const opProt = (m) => m.protein || 0
    switch (sortering) {
      case 'same-cal':
        return [...meals].sort((a, b) => Math.abs(opCal(a) - currentCal) - Math.abs(opCal(b) - currentCal))
      case 'more-cal':
        return [...meals].filter(m => opCal(m) > currentCal).sort((a, b) => opCal(a) - opCal(b))
      case 'less-cal':
        return [...meals].filter(m => opCal(m) > 0 && opCal(m) < currentCal).sort((a, b) => opCal(b) - opCal(a))
      case 'same-protein':
        return [...meals].sort((a, b) => Math.abs(opProt(a) - currentProt) - Math.abs(opProt(b) - currentProt))
      case 'more-protein':
        return [...meals].filter(m => opProt(m) > currentProt).sort((a, b) => opProt(a) - opProt(b))
      case 'less-protein':
        return [...meals].filter(m => opProt(m) < currentProt).sort((a, b) => opProt(b) - opProt(a))
      default: {
        // Beste match: de volgorde die de service al bedacht (kcal + eiwit
        // tegen elkaar afgewogen), voor zover die maaltijden in de pool
        // zitten; de rest erachter op kcal-verschil.
        const rang = new Map((alternatives || []).map((m, i) => [m.id, i]))
        return [...meals].sort((a, b) => {
          const ra = rang.has(a.id) ? rang.get(a.id) : Infinity
          const rb = rang.has(b.id) ? rang.get(b.id) : Infinity
          if (ra !== rb) return ra - rb
          return Math.abs(opCal(a) - currentCal) - Math.abs(opCal(b) - currentCal)
        })
      }
    }
  }

  // Een maaltijd uit de lijst kopiëren naar de eigen maaltijden. Bewust een
  // kopie in ai_custom_meals en geen verwijzing: "Mijn maaltijden" is een
  // eigen lijst die je daarna kunt aanpassen, en de rest van de app leest die
  // tabel al.
  // De ingrediënten van een ai_meal zijn verwijzingen: {ingredient_id, amount,
  // unit}, zonder naam en zonder macro's. Het maaltijd-scherm rekent zijn
  // totalen uít de ingrediënten, dus zo'n lijst kopiëren gaf een maaltijd van
  // 0 kcal met regels als "250gram". Daarom slaan we ze hier uitgeschreven op:
  // naam plus de macro's voor die hoeveelheid.
  const schrijfIngredientenUit = async (lijst) => {
    const rijen = Array.isArray(lijst) ? lijst : []
    const ids = [...new Set(rijen.map(r => r?.ingredient_id).filter(Boolean))]
    if (ids.length === 0) {
      // Al uitgeschreven (eigen maaltijd) of niets bekend: alleen doorgeven
      // wat zelf al macro's heeft, anders liever niets dan nullen.
      return rijen.some(r => r?.calories || r?.protein) ? rijen : null
    }
    try {
      const { data, error } = await db.supabase
        .from('ai_ingredients')
        .select('id, name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g')
        .in('id', ids)
      if (error) throw error
      const opId = new Map((data || []).map(i => [i.id, i]))
      const uit = rijen.map(r => {
        const bron = opId.get(r.ingredient_id)
        if (!bron) return null
        const gram = Number(r.amount) || 0
        const deel = gram / 100
        return {
          name: bron.name,
          amount: gram,
          unit: r.unit || 'gram',
          calories: Math.round((bron.calories_per_100g || 0) * deel),
          protein: Math.round((bron.protein_per_100g || 0) * deel * 10) / 10,
          carbs: Math.round((bron.carbs_per_100g || 0) * deel * 10) / 10,
          fat: Math.round((bron.fat_per_100g || 0) * deel * 10) / 10,
        }
      }).filter(Boolean)
      return uit.length ? uit : null
    } catch (e) {
      console.error('Ingrediënten uitschrijven mislukt:', e)
      return null
    }
  }

  const bewaarInMijnMaaltijden = async (meal, sectie) => {
    if (!meal || !client?.id || !db?.supabase) return
    setSterBezig(true)
    try {
      const ingredienten = await schrijfIngredientenUit(meal.ingredients_list)
      const { data, error } = await db.supabase.from('ai_custom_meals').insert({
        client_id: client.id,
        name: meal.name,
        calories: Math.round(meal.calories || 0),
        protein: Math.round(meal.protein || 0),
        carbs: Math.round(meal.carbs || 0),
        fat: Math.round(meal.fat || 0),
        fiber: Math.round(meal.fiber || 0),
        ingredients_list: ingredienten,
        image_url: meal.image_url || null,
        section: sectie || null,
        is_active: true,
      }).select().single()
      if (error) throw error
      setCustomMeals(prev => [...prev, { ...data, _isCustom: true }])
      setSterMeal(null)
    } catch (e) {
      console.error('Opslaan in mijn maaltijden mislukt:', e)
      alert('Kon de maaltijd niet aan je eigen maaltijden toevoegen.')
    } finally {
      setSterBezig(false)
    }
  }

  const openInfo = async (meal) => {
    setInfoMeal(meal)
    setInfoIngredienten(null)
    const uit = await schrijfIngredientenUit(meal.ingredients_list)
    setInfoIngredienten(uit || [])
  }

  const staatInMijnMaaltijden = (meal) =>
    customMeals.some(m => String(m.name || '').toLowerCase() === String(meal?.name || '').toLowerCase())

  const getDiff = (newVal, oldVal) => {
    const diff = Math.round((newVal || 0) - (oldVal || 0))
    if (diff > 0) return { text: `+${diff}`, color: '#fff', Icon: ArrowUp }
    if (diff < 0) return { text: `${diff}`, color: '#ef4444', Icon: ArrowDown }
    return { text: '0', color: 'rgba(255,255,255,0.3)', Icon: Minus }
  }

  const filteredMeals = getFilteredMeals()

  if (!isOpen) return null

  return (
    <>
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.9)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 10500,
        animation: 'altFadeIn 0.2s ease'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          maxWidth: isMobile ? '100%' : '600px',
          width: '100%',
          margin: '0 auto',
          background: '#0a0a0a',
          overflow: 'hidden'
        }}
      >
        {/* ── Header ── */}
        <div style={{
          padding: isMobile ? '0.75rem 1rem' : '1rem 1.5rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          flexShrink: 0
        }}>
          {/* Titel + sluiten */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: 10, marginBottom: '0.7rem',
          }}>
            <div style={{
              fontSize: isMobile ? '1.15rem' : '1.3rem',
              fontWeight: 900, color: '#fff', letterSpacing: '-0.025em',
            }}>
              Wissel maaltijd
            </div>
            <button
              onClick={onClose}
              aria-label="Sluit"
              style={{
                width: '36px', height: '36px', flexShrink: 0,
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <X size={16} strokeWidth={2.5} />
            </button>
          </div>

          {/* De maaltijd die je gaat wisselen als kaart, niet als losse naam:
              dezelfde kaart als in de dagplanning, zonder knoppen. */}
          <div style={{ margin: isMobile ? '0 -1rem 0.7rem' : '0 -1.5rem 0.8rem' }}>
            <MealCard
              meal={{
                name: currentMeal?.name || currentMeal?.meal_name,
                image_url: currentMeal?.image_url,
                slot: currentMeal?.slot,
                timing: currentMeal?.timing,
                calories: currentMeal?.calories, protein: currentMeal?.protein,
                carbs: currentMeal?.carbs, fat: currentMeal?.fat,
              }}
              isMobile={isMobile}
              acties={[]}
            />
          </div>

          <div style={{
            fontSize: isMobile ? '0.9rem' : '1rem', fontWeight: 900, color: '#fff',
            letterSpacing: '-0.02em', marginBottom: '0.5rem',
          }}>
            Wissel voor:
          </div>

          {/* Search */}
          <div style={{ position: 'relative', marginBottom: '0.625rem' }}>
            <Search
              size={15}
              style={{
                position: 'absolute',
                left: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'rgba(255, 255, 255, 0.2)'
              }}
            />
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
                borderRadius: '10px',
                color: 'white',
                fontSize: isMobile ? '0.8rem' : '0.85rem',
                outline: 'none',
                minHeight: '40px',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)'}
              onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)'}
            />
          </div>

          {/* Drie keuzes: welk moment, waar zoeken, welke volgorde. Losse
              tekst met een pijltje, gescheiden door een lijntje — geen vakken,
              die maakten van de kop een formulier. */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Keuze waarde={moment} opties={momentOpties} zet={setMoment} isMobile={isMobile} />
            <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.15)', flexShrink: 0 }} />
            <Keuze waarde={bron} opties={bronOpties} zet={setBron} isMobile={isMobile} />
            <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.15)', flexShrink: 0 }} />
            <Keuze waarde={sortering} opties={sorteerOpties} zet={setSortering} isMobile={isMobile} uitlijning="rechts" />
          </div>
        </div>

        {/* ── Meal List ── */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch'
        }}>
          {loading ? (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              padding: '3rem',
              color: 'rgba(255, 255, 255, 0.2)'
            }}>
              <div style={{
                width: '32px', height: '32px',
                border: '2px solid rgba(255, 255, 255, 0.06)',
                borderTopColor: 'rgba(255, 255, 255, 0.3)',
                borderRadius: '50%',
                animation: 'altSpin 0.8s linear infinite'
              }} />
            </div>
          ) : filteredMeals.length > 0 ? (
            filteredMeals.map((meal, idx) => (
              <SuggestieKaart
                key={meal.id || idx}
                meal={meal}
                currentMeal={currentMeal}
                isSelected={selectedMeal?.id === meal.id}
                onSelect={() => setSelectedMeal(selectedMeal?.id === meal.id ? null : meal)}
                isMobile={isMobile}
                inMijnMaaltijden={meal._isCustom || staatInMijnMaaltijden(meal)}
                onSter={() => setSterMeal(meal)}
                onInfo={() => openInfo(meal)}
              />
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem 1.25rem' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 900, color: '#fff', marginBottom: '0.35rem' }}>
                Geen resultaten
              </div>
              <div style={{
                fontSize: '0.76rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)',
                lineHeight: 1.45, maxWidth: 300, margin: '0 auto',
              }}>
                {/* Coach-suggesties horen bij een slot, niet bij een moment: je
                    coach kiest ze voor deze plek in de dag. Een moment-filter
                    erbovenop levert dan al snel niets op, en dat is geen fout
                    maar een lege doorsnede. Zeg dat dan ook. */}
                {bron === 'coach' && moment !== 'alles'
                  ? `Je coach heeft voor ${(momentOpties.find(o => o.id === moment)?.label || moment).toLowerCase()} geen suggesties gezet.`
                  : bron === 'coach'
                    ? 'Je coach heeft nog geen suggesties gezet.'
                    : bron === 'mine'
                      ? 'Je hebt hier nog geen eigen maaltijden die passen.'
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

          {/* Eigen maaltijden: de weg naar het aanmaakscherm hoort onderaan de
              lijst waar je 'm mist. */}
          {bron === 'mine' && onMaaltijdAanmaken && !loading && (
            <div style={{ padding: isMobile ? '0.75rem 1rem 1.5rem' : '1rem 1.5rem 2rem' }}>
              <button
                onClick={onMaaltijdAanmaken}
                style={{
                  width: '100%', minHeight: 48,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                  background: '#fff', border: 'none', borderRadius: 12,
                  color: '#0a0a0a', fontSize: '0.88rem', fontWeight: 900,
                  fontFamily: 'inherit', cursor: 'pointer',
                  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                }}
              >
                <Plus size={16} strokeWidth={3} /> Maaltijd aanmaken
              </button>
            </div>
          )}
        </div>

      </div>
    </div>

      {/* Wat zit erin en hoe liggen de verhoudingen — voordat je kiest. */}
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
              ].map(m => (
                <div key={m.label} style={{
                  flex: 1, minWidth: 0, textAlign: 'center',
                  padding: '0.5rem 0.25rem',
                  border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10,
                }}>
                  <div style={{ fontSize: '1rem', fontWeight: 900, color: '#fff', lineHeight: 1.1 }}>{m.waarde}</div>
                  <div style={{
                    fontSize: '0.55rem', fontWeight: 800, color: 'rgba(255,255,255,0.35)',
                    textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2,
                  }}>{m.label}</div>
                </div>
              ))}
            </div>

            <div style={{
              fontSize: '0.62rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)',
              textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem',
            }}>
              Ingrediënten
            </div>
            {infoIngredienten === null ? (
              <div style={{ padding: '1rem 0', color: 'rgba(255,255,255,0.3)', fontSize: '0.78rem' }}>Laden…</div>
            ) : infoIngredienten.length === 0 ? (
              <div style={{ padding: '0.5rem 0 1rem', color: 'rgba(255,255,255,0.35)', fontSize: '0.78rem', fontWeight: 700 }}>
                Van deze maaltijd staan geen ingrediënten in de database.
              </div>
            ) : (
              // Zelfde kaart als overal, ook voor de losse ingrediënten: je
              // ziet meteen wat het is en wat het bijdraagt.
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
                    momentLabel={`${ing.amount}${ing.unit === 'gram' ? 'g' : ` ${ing.unit || ''}`}`}
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

      {/* Blad dat vraagt bij welk moment de maaltijd hoort voor je 'm bij je
          eigen maaltijden zet. Zonder die vraag belandt alles op één hoop en
          doet het moment-filter daar niets meer. */}
      <BladModal
        open={!!sterMeal}
        titel="Bij mijn maaltijden zetten"
        onClose={() => setSterMeal(null)}
        zIndex={10600}
      >
        {sterMeal && (
          <>
            <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#fff', marginBottom: 4 }}>
              {sterMeal.name}
            </div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)', marginBottom: 14 }}>
              Bij welk moment hoort deze maaltijd?
            </div>
            {[...momentOpties.filter(o => o.id !== 'alles'), { id: '', label: 'Geen moment' }].map(o => (
              <button
                key={o.id || 'geen'}
                onClick={() => bewaarInMijnMaaltijden(sterMeal, o.id)}
                disabled={sterBezig}
                style={{
                  width: '100%', textAlign: 'left',
                  padding: '0.7rem 0.9rem', marginBottom: 8,
                  background: 'transparent', border: '1px solid rgba(255,255,255,0.18)',
                  borderRadius: 11, color: '#fff',
                  fontSize: '0.85rem', fontWeight: 900, fontFamily: 'inherit',
                  cursor: sterBezig ? 'wait' : 'pointer',
                  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                }}
              >
                {o.label}
              </button>
            ))}
          </>
        )}
      </BladModal>

      {/* Bevestigen in een blad, hetzelfde als de historie in het log-scherm:
          de nieuwe maaltijd als kaart, het verschil met de huidige eronder en
          dan pas de knop. Stond eerder als strook onderaan het venster,
          waardoor de vergelijking half over de lijst viel. */}
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
                  slot: selectedMeal.slot || currentMeal?.slot,
                  calories: selectedMeal.calories, protein: selectedMeal.protein,
                  carbs: selectedMeal.carbs, fat: selectedMeal.fat,
                }}
                momentLabel={selectedMeal._isCustom ? 'Eigen maaltijd' : 'Nieuw'}
                isMobile={isMobile}
                acties={[]}
              />
            </div>

            <div style={{
              fontSize: '0.62rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)',
              textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem',
            }}>
              Verschil met {currentMeal?.name || 'je huidige maaltijd'}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.1rem' }}>
              {[
                { label: 'kcal', diff: getDiff(selectedMeal.calories, currentMeal?.calories) },
                { label: 'eiwit', diff: getDiff(selectedMeal.protein, currentMeal?.protein) },
                { label: 'koolh', diff: getDiff(selectedMeal.carbs, currentMeal?.carbs) },
                { label: 'vet', diff: getDiff(selectedMeal.fat, currentMeal?.fat) },
              ].map(item => (
                <div key={item.label} style={{
                  flex: 1, minWidth: 0, textAlign: 'center',
                  padding: '0.5rem 0.25rem',
                  border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10,
                }}>
                  <div style={{
                    fontSize: isMobile ? '0.95rem' : '1.05rem', fontWeight: 900,
                    color: item.diff.color, letterSpacing: '-0.02em', lineHeight: 1.1,
                  }}>
                    {item.diff.text}
                  </div>
                  <div style={{
                    fontSize: '0.55rem', fontWeight: 800, color: 'rgba(255,255,255,0.35)',
                    textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2,
                  }}>
                    {item.label}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => onSelectMeal(selectedMeal.id)}
              style={{
                width: '100%', minHeight: 50, marginBottom: '0.5rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                background: '#fff', border: 'none', borderRadius: 12,
                color: '#0a0a0a', fontSize: '0.95rem', fontWeight: 900,
                fontFamily: 'inherit', cursor: 'pointer',
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              }}
            >
              <Check size={16} strokeWidth={3} /> Wissel hiermee
            </button>
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
        @keyframes altFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes altSpin {
          to { transform: rotate(360deg); }
        }
        div::-webkit-scrollbar { display: none; }
      `}</style>
    </>
  )
}

// ── Single meal row in the list ──
// Een suggestie in het wisselvenster: dezelfde kaart als in de dagplanning,
// zodat je niet naar twee soorten maaltijdregels zit te kijken. Op de foto
// staat het verschil met de huidige maaltijd: kcal op de eerste regel, eiwit
// eronder. Dat zijn de twee waarop je een maaltijd inruilt. Geen "Eigen"-label
// meer voor eigen maaltijden: dat duwde het kcal-verschil van de foto af, en
// die staan al onder hun eigen filter.
function SuggestieKaart({ meal, currentMeal, isSelected, onSelect, isMobile, inMijnMaaltijden, onSter, onInfo }) {
  const teken = (n) => `${n > 0 ? '+' : ''}${n}`
  const kcalOp = Math.round((meal.calories || 0) - (currentMeal?.calories || 0))
  const eiwitOp = Math.round((meal.protein || 0) - (currentMeal?.protein || 0))
  const kcalLabel = kcalOp === 0 ? 'Zelfde kcal' : `${teken(kcalOp)} kcal`
  const eiwitLabel = eiwitOp === 0 ? 'zelfde eiwit' : `${teken(eiwitOp)}g eiwit`

  return (
    <MealCard
      meal={{
        name: meal.name,
        image_url: meal.image_url,
        slot: meal.slot || currentMeal?.slot,
        calories: meal.calories, protein: meal.protein,
        carbs: meal.carbs, fat: meal.fat,
      }}
      momentLabel={kcalLabel}
      tijdLabel={eiwitLabel}
      isMobile={isMobile}
      geselecteerd={isSelected}
      onCheck={onSelect}
      hoekKnop={
        <button
          onClick={(e) => { e.stopPropagation(); if (!inMijnMaaltijden) onSter?.() }}
          aria-label={inMijnMaaltijden ? 'Staat in jouw maaltijden' : 'Zet bij mijn maaltijden'}
          title={inMijnMaaltijden ? 'Staat al in jouw maaltijden' : 'Zet bij mijn maaltijden'}
          style={{
            width: 28, height: 28, padding: 0,
            background: 'transparent', border: 'none', borderRadius: 7,
            color: '#fff', opacity: inMijnMaaltijden ? 1 : 0.55,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: inMijnMaaltijden ? 'default' : 'pointer',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          }}
        >
          <Star size={14} strokeWidth={2.6} fill={inMijnMaaltijden ? '#fff' : 'none'} />
        </button>
      }
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
