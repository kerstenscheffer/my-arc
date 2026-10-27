// src/modules/meal-plan/components/AIAlternativesModal.jsx
// 🎯 v2.0 - Clean swap modal with smart suggestions & compare
// Props IDENTIEK: { isOpen, onClose, currentMeal, onSelectMeal, db, service }
import React, { useState, useEffect, useRef } from 'react'
import useZoekLog from './food-log/useZoekLog'
import MealCard from './day-schedule/MealCard'
import Keuze from './Keuze'
import { foodImageFallback, resolveFoodImage } from '../foodImageFallback'
import { niveauVoorDoel, wisselNiveauVoorDoel } from '../DayTemplateService'
import { stukVan } from './food-log/portionPresets'
import PartnerBestellen, { PartnerLabel } from './PartnerBestellen'
import GramInvoer from './GramInvoer'
// Hetzelfde blad als de historie in het workout-log-scherm; één vorm voor
// "extra scherm dat vanaf onderen openschuift" in de hele app.
import BladModal from '../../workout/components/todays-workout/components/BladModal'
import { X, Search, Check, ArrowUp, ArrowDown, Minus, Heart, Plus, Info, SlidersHorizontal, ArrowRight, Utensils } from 'lucide-react'
import { createPortal } from '../../../client/paginaPortal'

// De secties van "Mijn maaltijden" heten anders dan de log-momenten hier.
const MOMENT_NAAR_SECTIE = {
  breakfast: 'ontbijt', lunch: 'lunch', dinner: 'diner',
  snack: 'snacks', post_workout: 'snacks', pre_workout: 'pre_workout',
}

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

// Avondsnack is in ai_meals geen eigen timing (die blijft 'snack'), maar wel
// een eigen moment in de keuzelijst en een eigen lijst vaste swaps van de
// coach ('avondsnack'). Herkend aan het slot of aan het label op de kaart.
const isAvondsnack = (slot, meal) =>
  /avond\s*snack|before_bed/i.test(`${slot || ''} ${meal?.display_label || ''} ${meal?.slot || ''} ${meal?.timeSlot || ''}`)
const swapSlotNaarMoment = (s) => (/avondsnack|before_bed/i.test(String(s || '')) ? 'avondsnack' : slotNaarMoment(s))
const basisMoment = (m) => (m === 'avondsnack' ? 'snack' : m)

// Wisselopties dragen hun groep als label ('groep:Op brood'). Binnen een
// moment staan ze in deze volgorde, met de groep als kopje erboven.
const GROEP_VOLGORDE = ['Op brood', 'Bowl', 'Wrap', 'Warm', 'Licht en snel', 'Klassiek', 'Pasta en wok', 'Mexicaans', 'Zoet', 'Hartig']
const groepVan = (m) => {
  const l = (Array.isArray(m?.labels) ? m.labels : []).map(String).find(x => x.startsWith('groep:'))
  return l ? l.slice(6) : null
}
const wisselNiveauVan = (m) => {
  const l = (Array.isArray(m?.labels) ? m.labels : []).map(String).find(x => x.startsWith('wissel_'))
  return l ? Number(l.slice(7)) : null
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
  client,
  // Ingebouwd in het log-venster ("Coach maaltijden"): geen eigen overlay,
  // titel of huidige maaltijd; een tik op een kaart kiest hem meteen via
  // onKiesMaaltijd (de portie kies je daarna in het log-venster).
  embedded = false,
  onKiesMaaltijd,
}) {
  const isMobile = window.innerWidth <= 768
  const zoekLog = useZoekLog({ db, client, modus: 'products', context: 'wissel' })
  const filteredMealsRef = useRef([])
  const [searchTerm, setSearchTerm] = useState('')
  // Drie keuzes in plaats van één rij chips: welk moment, waar zoeken, en de
  // volgorde. De eerste twee snijden de lijst bij, de derde bepaalt alleen de
  // volgorde — daarom is die er één en geen meervoud.
  const [moment, setMoment] = useState('alles')
  const [bron, setBron] = useState('alles')
  const [sortering, setSortering] = useState('smart')
  // Grenzen in plaats van alleen volgorde: "laat me alles zien onder de 400
  // kcal" of "minstens 30 gram eiwit". De volgorde-keuze zegt hoe de lijst
  // gesorteerd is, dit zegt wat er in mag.
  const [maxKcal, setMaxKcal] = useState('')
  const [minEiwit, setMinEiwit] = useState('')
  const [toonFilter, setToonFilter] = useState(false)
  // Het caloriedoel bepaalt welk dagmenu-niveau je ziet. Het zit niet altijd
  // op het client-object dat dit venster binnenkrijgt, dus halen we het er zo
  // nodig zelf bij — anders valt het hele niveau weg en blijft er van de
  // suggesties niets over.
  const [doelKcal, setDoelKcal] = useState(client?.target_calories || null)
  const [alternatives, setAlternatives] = useState([])
  const [allMeals, setAllMeals] = useState([])
  const [customMeals, setCustomMeals] = useState([])
  const [coachOptions, setCoachOptions] = useState([]) // door coach gecureerde swaps voor dit slot
  // Alle coach-lijsten, per moment. De coach kiest zijn vervangers per slot,
  // dus "Coach-suggesties + Lunch" hoort zijn lunch-lijst te tonen — niet de
  // lijst van het slot dat je toevallig wisselt, gefilterd op timing.
  const [coachPerMoment, setCoachPerMoment] = useState({})
  // Vaste wisselopties voor het kcal-niveau van de klant, per moment.
  const [wisselPerMoment, setWisselPerMoment] = useState({})
  // Maaltijd die naar "Mijn maaltijden" gaat; het blad vraagt eerst bij welk
  // moment hij hoort.
  const [sterMeal, setSterMeal] = useState(null)
  const [sterBezig, setSterBezig] = useState(false)
  // Maaltijd waarvan het info-blad open staat, met zijn uitgeschreven
  // ingrediënten (die zijn in ai_meals alleen verwijzingen).
  const [infoMeal, setInfoMeal] = useState(null)
  const [infoIngredienten, setInfoIngredienten] = useState(null)
  // Aangepaste hoeveelheden in het info-blad, per regel (index -> gram).
  const [infoGram, setInfoGram] = useState({})
  const [infoBezig, setInfoBezig] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedMeal, setSelectedMeal] = useState(null)

  // Slot van de huidige maaltijd → naar de curatie-slots (snack1/2/3 → snack,
  // behalve een avondsnack: die heeft een eigen lijst en een eigen moment).
  // Het label op de kaart wint van het slot: een coach die een lunchplek
  // "Diner" noemt (maaltijden verschoven in het plan), bedoelt een diner, en
  // dan hoort de swaplijst op diner te openen (Mark Behr, 12 okt 2026).
  const slotKey = (() => {
    if (isAvondsnack(currentMeal?.slot || currentMeal?.timeSlot, currentMeal)) return 'avondsnack'
    const herken = (tekst) => {
      const v = String(tekst || '').toLowerCase()
      if (v.includes('breakfast') || v.includes('ontbijt')) return 'breakfast'
      if (v.includes('lunch')) return 'lunch'
      if (v.includes('dinner') || v.includes('diner') || v.includes('avondeten')) return 'dinner'
      if (v.includes('pre')) return 'pre_workout'
      if (v.includes('post')) return 'post_workout'
      if (v.includes('snack')) return 'snack'
      return null
    }
    // Een label zonder herkenbaar moment ("Maaltijd 3") valt terug op het slot.
    return herken(currentMeal?.display_label)
      || herken(currentMeal?.slot || currentMeal?.timeSlot || currentMeal?.timing?.[0])
      || 'snack'
  })()

  const momentOpties = [
    { id: 'alles', label: 'Alle maaltijden' },
    { id: 'breakfast', label: 'Ontbijt' },
    { id: 'lunch', label: 'Lunch' },
    { id: 'dinner', label: 'Diner' },
    { id: 'snack', label: 'Snack' },
    { id: 'avondsnack', label: 'Avondsnack' },
    { id: 'pre_workout', label: 'Pre-workout' },
    { id: 'post_workout', label: 'Post-workout' },
  ]

  const bronOpties = [
    { id: 'alles', label: 'Overal zoeken' },
    // 'Wisselopties' zei een klant niets: het is de vaste set die bij jouw
    // niveau en dit moment past.
    ...(Object.keys(wisselPerMoment).length > 0 ? [{ id: 'wissel', label: 'Aanraders' }] : []),
    ...(coachOptions.length > 0 ? [{ id: 'coach', label: 'Van je coach' }] : []),
    ...(customMeals.length > 0 ? [{ id: 'mine', label: 'Mijn maaltijden' }] : []),
    // Kant-en-klaar te bestellen (PrepMyMeal).
    ...(allMeals.some(m => m.partner) ? [{ id: 'partner', label: 'Kant-en-klaar (PrepMyMeal)' }] : []),
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
    if ((isOpen || embedded) && currentMeal) {
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
        slotKey
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
            const moment = swapSlotNaarMoment(slot)
            perMoment[moment] = [...(perMoment[moment] || []), ...lijst]
          })
          // Avondsnack zonder eigen lijst valt terug op de snacklijst.
          const eigenIds = alleSlots?.[slotKey]?.meal_ids?.length ? alleSlots[slotKey].meal_ids : (alleSlots?.[basisMoment(slotKey)]?.meal_ids || [])
          curated = eigenIds.map(id => opId.get(id)).filter(Boolean)
        }
      } catch (e) { /* geen curatie → gewoon de normale pool */ }

      // Dagmenu's als vaste suggesties. Elk moment heeft binnen een niveau
      // vijf gerechten met vrijwel dezelfde macro's, dus ze zijn onderling
      // inwisselbaar — precies wat je zoekt als je wisselt. Welk niveau?
      // Dat wat het dichtst bij het caloriedoel van deze klant ligt, zodat
      // iemand van 2200 de ontbijten van het 2000-menu krijgt en niet die van
      // 3000. De coach hoeft hier niets voor in te stellen.
      try {
        let doel = client?.target_calories || doelKcal
        if (!doel && client?.id) {
          const { data: rij } = await db.supabase
            .from('clients').select('target_calories').eq('id', client.id).maybeSingle()
          doel = rij?.target_calories || null
          if (doel) setDoelKcal(doel)
        }
        const niveau = niveauVoorDoel(doel)
        if (niveau) {
          // Op internal_name (dagmenu3000_kwarkbowl) in plaats van op het
          // label: een gewone tekstvergelijking, geen jsonb-containment.
          const { data: dagmenu, error: dagmenuFout } = await db.supabase
            .from('ai_meals')
            .select('*')
            .like('internal_name', `dagmenu${niveau}_%`)
          if (dagmenuFout) console.warn('Dagmenu-suggesties:', dagmenuFout.message)
          const alGekozen = new Set([...(curated || []).map(m => m.id)])
          ;(dagmenu || []).forEach(m => {
            const moment = slotNaarMoment((Array.isArray(m.timing) ? m.timing[0] : m.timing) || m.meal_type)
            // Achteraan: wat de coach zelf koos staat voorop.
            if (!(perMoment[moment] || []).some(x => x.id === m.id)) {
              perMoment[moment] = [...(perMoment[moment] || []), m]
            }
            if (moment === basisMoment(slotKey) && !alGekozen.has(m.id)) {
              curated = [...curated, m]
              alGekozen.add(m.id)
            }
          })
        }
      } catch (e) { console.warn('Dagmenu-suggesties laden mislukt:', e?.message) }

      // Wisselopties: per niveau en moment een vaste set gerechten die binnen
      // dezelfde kcal-band vallen. Geen schalen: elk niveau heeft zijn eigen
      // porties in hele eenheden.
      let wissel = {}
      try {
        const wNiveau = wisselNiveauVoorDoel(client?.target_calories || doelKcal || (await (async () => {
          if (!client?.id) return null
          const { data: rij } = await db.supabase.from('clients').select('target_calories').eq('id', client.id).maybeSingle()
          return rij?.target_calories || null
        })()))
        if (wNiveau) {
          const { data: opties, error: wFout } = await db.supabase
            .from('ai_meals').select('*').like('internal_name', `wissel${wNiveau}_%`)
          if (wFout) console.warn('Wisselopties:', wFout.message)
          ;(opties || []).forEach(m => {
            const mo = slotNaarMoment((Array.isArray(m.timing) ? m.timing[0] : m.timing) || m.meal_type)
            wissel[mo] = [...(wissel[mo] || []), m]
          })
          Object.values(wissel).forEach(lijst => lijst.sort((a, b) => {
            const ga = GROEP_VOLGORDE.indexOf(groepVan(a)), gb = GROEP_VOLGORDE.indexOf(groepVan(b))
            return ga !== gb ? ga - gb : String(a.name).localeCompare(String(b.name))
          }))
        }
      } catch (e) { console.warn('Wisselopties laden mislukt:', e?.message) }

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
      // Partnergerechten die niet meer leverbaar zijn horen er niet tussen.
      setAllMeals((meals || []).filter(m => !m.partner || m.partner_actief !== false))
      setCustomMeals(custom)
      setCoachOptions(curated)
      setCoachPerMoment(perMoment)
      setWisselPerMoment(wissel)
      // Wissel je een ontbijt, dan wil je bijna altijd een ander ontbijt zien.
      // "Alle maaltijden" is één tik weg.
      setMoment(slotKey)
      // Wisselopties voor dit moment gaan voor: dat is waar je voor wisselt.
      // Anders wat de coach voor dit slot heeft ingesteld.
      if ((wissel[basisMoment(slotKey)] || []).length > 0) setBron('wissel')
      else if (curated.length > 0) setBron('coach')
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
  // Dagmenu's: elk gerecht draagt het label van zijn niveau (dagmenu_2000,
  // _2500, _3000). Dezelfde gerechten bestaan in drie maten, dus je ziet er
  // maar één — anders kiest een klant van 2000 kcal een bord van 3000.
  //
  // Welk niveau dat is, hangt aan het caloriedoel van de klant en niet aan de
  // maaltijd die hij toevallig wisselt. Dat laatste ging mis: eet hij een dag
  // uit het 2000-menu terwijl zijn doel 3150 is, dan filterde hij juist de
  // suggesties weg die bij hem passen. Is het doel onbekend, dan volgen we
  // alsnog de maaltijd.
  const niveauVan = (m) => {
    const labels = Array.isArray(m?.labels) ? m.labels : []
    const label = labels.map(String).find(l => l.startsWith('dagmenu_'))
    return label ? Number(label.replace('dagmenu_', '')) : null
  }
  const huidigNiveau = niveauVoorDoel(client?.target_calories || doelKcal) || niveauVan(currentMeal)
  const huidigWisselNiveau = wisselNiveauVoorDoel(client?.target_calories || doelKcal) || wisselNiveauVan(currentMeal)

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

  const filterActief = !!(maxKcal || minEiwit)

  const getFilteredMeals = () => {
    const currentCal = currentMeal?.calories || 0
    const currentProt = currentMeal?.protein || 0
    const nietZelf = (m) => m.id !== currentMeal?.id

    // 1. Waar zoeken we?
    let pool
    if (bron === 'wissel') {
      pool = (moment !== 'alles'
        ? (wisselPerMoment[basisMoment(moment)] || [])
        : Object.values(wisselPerMoment).flat()
      ).filter(nietZelf)
    }
    else if (bron === 'coach') {
      // Kies je een moment, dan zie je de lijst die de coach voor dát moment
      // heeft gezet. Zonder moment: eerst de lijst van het slot dat je
      // wisselt, daarna de rest.
      if (moment !== 'alles') {
        // Geen eigen avondsnack-lijst? Dan de snacklijst.
        const lijst = coachPerMoment[moment]?.length ? coachPerMoment[moment] : (coachPerMoment[basisMoment(moment)] || [])
        pool = lijst.filter(nietZelf)
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
    else if (bron === 'partner') pool = allMeals.filter(m => m.partner && nietZelf(m))
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

    // 2. Zoekterm gaat vóór het moment-filter én vóór de bron: typ je iets,
    // dan wil je het vinden, ook als het bij een ander moment of in een
    // andere lijst staat. Zocht dit alleen binnen de gekozen bron, dan gaf
    // "prepmymeal" onder Wisselopties niets. Ook de maker telt mee
    // (prepmymeal, kant-en-klaar), en alle woorden moeten erin staan.
    if (searchTerm) {
      const plat = (t) => String(t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ')
      const woorden = plat(searchTerm).split(' ').filter(Boolean)
      const alles = bron === 'mine' ? pool : (() => {
        const gezien = new Set()
        return [...pool, ...Object.values(wisselPerMoment).flat(), ...coachOptions, ...customMeals, ...allMeals].filter(m => {
          if (!nietZelf(m) || gezien.has(m.id)) return false
          gezien.add(m.id)
          return true
        })
      })()
      const hooi = (m) => {
        const t = `${plat(m.name)} ${plat(m.name_en)} ${m.partner ? `${plat(m.partner)} prep my meal kant en klaar` : ''}`
        return { t, compact: t.replace(/ /g, '') }
      }
      const treffers = alles.filter(m => {
        const h = hooi(m)
        return woorden.every(w => h.t.includes(w) || h.compact.includes(w))
      })
      // Naam die met de zoekterm begint eerst.
      const begin = plat(searchTerm).trim()
      return treffers.sort((a, b) => (plat(b.name).startsWith(begin) ? 1 : 0) - (plat(a.name).startsWith(begin) ? 1 : 0))
    }

    // 3. Welk moment? Maaltijden zonder moment blijven staan — 19 van de 482
    // hebben geen timing, en die wegfilteren maakt ze onvindbaar.
    // Coach-lijsten zijn al per moment gekozen; er nog eens de timing van de
    // maaltijd overheen leggen zou precies de suggesties wegfilteren die de
    // coach bewust op die plek zette.
    let meals = pool
    if (moment !== 'alles' && bron !== 'coach' && bron !== 'wissel') {
      meals = pool.filter(m => {
        const set = momentenVan(m)
        return set.size === 0 || set.has(moment) || set.has(basisMoment(moment))
      })
    }

    // Zit je in een dagmenu, dan vallen de andere niveaus weg. Eet je niet uit
    // een dagmenu, dan blijft alles staan zoals het was.
    if (huidigNiveau) {
      meals = meals.filter(m => {
        const n = niveauVan(m)
        // De maaltijd die je nu wisselt blijft altijd staan, ook als hij uit
        // een ander niveau komt: hem verstoppen zou raar zijn.
        if (m.id && currentMeal && (m.id === (currentMeal.meal_id || currentMeal.id))) return true
        return !n || n === huidigNiveau
      })
    }
    // Wisselopties van een ander niveau horen nooit in de lijst: die zijn
    // voor een ander caloriedoel gemaakt.
    meals = meals.filter(m => {
      const n = wisselNiveauVan(m)
      return !n || !huidigWisselNiveau || n === huidigWisselNiveau
    })

    // 4. Grenzen op kcal en eiwit. Wie een maximum of minimum invult, wil die
    // maaltijden zien en de rest niet — ook niet onderaan.
    const kcalGrens = parseFloat(String(maxKcal).replace(',', '.'))
    const eiwitGrens = parseFloat(String(minEiwit).replace(',', '.'))
    if (Number.isFinite(kcalGrens) && kcalGrens > 0) {
      meals = meals.filter(m => (m.calories || 0) <= kcalGrens)
    }
    if (Number.isFinite(eiwitGrens) && eiwitGrens > 0) {
      meals = meals.filter(m => (m.protein || 0) >= eiwitGrens)
    }

    // 5. Volgorde.
    const opCal = (m) => m.calories || 0
    const opProt = (m) => m.protein || 0
    // Wisselopties staan op groep (Op brood, Wrap, Warm, …); die volgorde is
    // al gezet bij het laden.
    if (bron === 'wissel' && sortering === 'smart') return meals
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
          ingredient_id: r.ingredient_id,
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
        // "Mijn maaltijden" deelt in op sectie-id's ('ontbijt', 'snacks'),
        // niet op log-momenten ('breakfast', 'snack'). Zonder deze vertaling
        // kwam een gesterd ontbijt daar onder "Overige" te staan.
        section: MOMENT_NAAR_SECTIE[sectie] || sectie || null,
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

  // Kiezen: in het log-venster meteen door naar de portie, anders eerst het
  // vergelijk-blad.
  const kies = (meal) => {
    if (searchTerm.trim().length >= 2) {
      zoekLog.gekozen(meal, filteredMealsRef.current.indexOf(meal))
    }
    if (embedded) { onKiesMaaltijd?.(meal); return }
    // Direct door naar de pop-up oud -> nieuw (daar kies je ook waar). Het
    // tussenblad "Wissel hiermee?" was een tweede bevestiging van hetzelfde.
    onSelectMeal?.(meal.id)
  }

  const openInfo = async (meal) => {
    setInfoMeal(meal)
    setInfoIngredienten(null)
    setInfoGram({})
    const uit = await schrijfIngredientenUit(meal.ingredients_list)
    setInfoIngredienten(uit || [])
  }

  // Hoeveelheden aanpassen in het info-blad. Elke regel schaalt lineair mee
  // met zijn oorspronkelijke hoeveelheid; de totalen bovenin rekenen live.
  const infoRegels = (infoIngredienten || []).map((ing, i) => {
    const orig = Number(ing.amount) || 0
    const nu = infoGram[i] !== undefined ? Math.max(0, Number(infoGram[i]) || 0) : orig
    const f = orig > 0 ? nu / orig : 0
    const r1 = (x) => Math.round((Number(x) || 0) * f * 10) / 10
    return {
      ...ing, amount: nu,
      calories: Math.round((Number(ing.calories) || 0) * f),
      protein: r1(ing.protein), carbs: r1(ing.carbs), fat: r1(ing.fat),
    }
  })
  const infoAangepast = Object.keys(infoGram).some(i =>
    Number(infoGram[i]) !== Number(infoIngredienten?.[i]?.amount))
  const infoTotaal = infoAangepast
    ? infoRegels.reduce((t, r) => ({
        calories: t.calories + r.calories, protein: t.protein + r.protein,
        carbs: t.carbs + r.carbs, fat: t.fat + r.fat,
      }), { calories: 0, protein: 0, carbs: 0, fat: 0 })
    : infoMeal

  // Aangepast? Dan een eigen kopie in Mijn maaltijden van deze klant, en die
  // kiezen (loggen of wisselen). Het origineel van de coach blijft staan.
  const kiesUitInfo = async () => {
    if (!infoMeal) return
    if (!infoAangepast) {
      const m = infoMeal
      setInfoMeal(null); setInfoIngredienten(null)
      kies(m)
      return
    }
    if (!client?.id || !db?.supabase) return
    setInfoBezig(true)
    try {
      const naam = /\(aangepast\)$/.test(infoMeal.name || '') ? infoMeal.name : `${infoMeal.name} (aangepast)`
      const sectie = MOMENT_NAAR_SECTIE[basisMoment(moment !== 'alles' ? moment : slotKey)] || null
      const { data, error } = await db.supabase.from('ai_custom_meals').insert({
        client_id: client.id,
        name: naam,
        calories: Math.round(infoTotaal.calories || 0),
        protein: Math.round(infoTotaal.protein || 0),
        carbs: Math.round(infoTotaal.carbs || 0),
        fat: Math.round(infoTotaal.fat || 0),
        fiber: 0,
        ingredients_list: infoRegels.filter(r => r.amount > 0).map(r => ({
          name: r.name, amount: r.amount, unit: r.unit || 'gram',
          calories: r.calories, protein: r.protein, carbs: r.carbs, fat: r.fat,
        })),
        image_url: infoMeal.image_url || null,
        section: sectie,
        is_active: true,
      }).select().single()
      if (error) throw error
      const nieuw = { ...data, _isCustom: true }
      setCustomMeals(prev => [...prev, nieuw])
      setInfoMeal(null); setInfoIngredienten(null); setInfoGram({})
      kies(nieuw)
    } catch (e) {
      console.error('Aangepaste maaltijd opslaan mislukt:', e)
      alert('Kon de aangepaste maaltijd niet opslaan.')
    } finally {
      setInfoBezig(false)
    }
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
  filteredMealsRef.current = filteredMeals

  // Zoekterm loggen zodra de gebruiker typt (wissel-context).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (searchTerm.trim().length >= 2) zoekLog.noteer(searchTerm, filteredMealsRef.current) }, [searchTerm])

  if (!isOpen && !embedded) return null

  // Los venster via een portal: binnen de maaltijdlaag (z-index 1) zweefden
  // de LOG-knop en de onderbalk eroverheen (27 okt 2026).
  const inhoud = (
    <>
    <div
      onClick={embedded ? undefined : onClose}
      style={embedded ? { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' } : {
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
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          maxWidth: embedded ? '100%' : (isMobile ? '100%' : '600px'),
          width: '100%',
          margin: '0 auto',
          background: '#0a0a0a',
          overflow: 'hidden'
        }}
      >
        {/* ── Header ── */}
        <div style={{
          padding: embedded ? (isMobile ? '0 1rem 0.6rem' : '0 1.25rem 0.75rem') : (isMobile ? '0.75rem 1rem' : '1rem 1.5rem'),
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          flexShrink: 0
        }}>
          {!embedded && (<>
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
                width: '36px', height: '36px', flexShrink: 0, padding: 0, marginRight: -6,
                background: 'none', border: 'none', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <X size={22} strokeWidth={2.4} />
            </button>
          </div>

          {/* De maaltijd die je wisselt -> lege plek voor de nieuwe. Zelfde
              beeld als de pop-up erna (oud -> nieuw), zodat je ziet wat je doet. */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap: 6, margin: '0.2rem 0 1rem' }}>
            {/* Nu: foto met naam en macro's eronder */}
            <div style={{ flex: '0 1 42%', minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <img src={resolveFoodImage(currentMeal || {}, { size: 200 })} alt=""
                onError={e => { e.currentTarget.style.visibility = 'hidden' }}
                style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover', opacity: 0.6, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }} />
              <div style={{ fontSize: '0.78rem', fontWeight: 900, color: '#fff', marginTop: '0.5rem' }}>
                {Math.round(currentMeal?.calories || 0)} kcal · {Math.round(currentMeal?.protein || 0)}g eiwit
              </div>
              <div style={{
                fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.55)', marginTop: 2, lineHeight: 1.25,
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
              }}>
                {currentMeal?.name || currentMeal?.meal_name}
              </div>
            </div>
            {/* Pijl op de hoogte van de cirkels */}
            <div style={{ height: 60, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
              <ArrowRight size={20} strokeWidth={2.8} color="#fff" />
            </div>
            {/* Nieuw: lege cirkel, even groot */}
            <div style={{ flex: '0 1 42%', minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <div style={{
                width: 60, height: 60, borderRadius: '50%', border: '1.5px dashed rgba(255,255,255,0.35)', boxSizing: 'border-box',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.6)',
              }}>
                <Utensils size={20} strokeWidth={2} />
              </div>
              <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'rgba(255,255,255,0.45)', marginTop: '0.5rem', lineHeight: 1.25 }}>
                Kies hieronder
              </div>
            </div>
          </div>
          </>)}

          {/* Search */}
          <div style={{ position: 'relative', marginBottom: '0.625rem' }}>
            <Search
              size={15}
              style={{
                position: 'absolute',
                left: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'rgba(255, 255, 255, 0.4)'
              }}
            />
            <input
              type="text"
              placeholder="Zoek maaltijd"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.6rem 0.75rem 0.6rem 2.25rem',
                background: 'rgba(255, 255, 255, 0.07)',
                border: 'none',
                borderRadius: '12px',
                color: 'white',
                fontSize: isMobile ? '0.85rem' : '0.9rem', fontWeight: 600,
                outline: 'none',
                minHeight: '42px',
                boxSizing: 'border-box', fontFamily: 'inherit',
              }}
            />
          </div>

          {/* Drie keuzes: welk moment, waar zoeken, welke volgorde. Losse
              tekst met een pijltje, gescheiden door een lijntje — geen vakken,
              die maakten van de kop een formulier. */}
          {/* Moment als pilletjes (zoals het logscherm); de gekozen wit. */}
          <div style={{ display: 'flex', gap: 2, overflowX: 'auto', scrollbarWidth: 'none', margin: isMobile ? '0 -1rem 0.35rem' : '0 -1.5rem 0.4rem', padding: isMobile ? '0 1rem' : '0 1.5rem' }}>
            {momentOpties.map(o => {
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
          {/* Waar zoeken en volgorde: twee losse keuzes op één regel. */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Keuze waarde={bron} opties={bronOpties} zet={setBron} isMobile={isMobile} />
            <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.15)', flexShrink: 0 }} />
            <Keuze waarde={sortering} opties={sorteerOpties} zet={setSortering} isMobile={isMobile} uitlijning="rechts" />
          </div>

          {/* Grenzen. Dicht, want de meeste keren wissel je zonder na te
              denken over getallen; wie het wel wil, tikt het open. */}
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
                ? [
                  maxKcal ? `max ${maxKcal} kcal` : null,
                  minEiwit ? `min ${minEiwit}g eiwit` : null,
                ].filter(Boolean).join(' · ')
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
                    type="number"
                    inputMode="numeric"
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
              <React.Fragment key={meal.id || idx}>
              {bron === 'wissel' && sortering === 'smart' && !searchTerm && groepVan(meal)
                && groepVan(meal) !== groepVan(filteredMeals[idx - 1]) && (
                <div style={{
                  padding: `${idx === 0 ? '0.2rem' : '0.9rem'} ${isMobile ? '0.9rem' : '1.25rem'} 0.35rem`,
                  fontSize: '0.68rem', fontWeight: 900, letterSpacing: '0.06em',
                  textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)',
                }}>
                  {groepVan(meal)}
                </div>
              )}
              <SuggestieKaart
                meal={meal}
                currentMeal={currentMeal}
                isSelected={selectedMeal?.id === meal.id}
                onSelect={() => kies(meal)}
                zonderVerschil={embedded}
                isMobile={isMobile}
                inMijnMaaltijden={meal._isCustom || staatInMijnMaaltijden(meal)}
                onSter={() => setSterMeal(meal)}
                onInfo={() => openInfo(meal)}
              />
              </React.Fragment>
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
                {bron === 'wissel'
                  ? 'Voor dit moment zijn er geen wisselopties. Zoek overal voor de rest.'
                  : bron === 'coach' && moment !== 'alles'
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
                { label: 'kcal', waarde: Math.round(infoTotaal?.calories || 0) },
                { label: 'eiwit', waarde: `${Math.round(infoTotaal?.protein || 0)}g` },
                { label: 'koolh', waarde: `${Math.round(infoTotaal?.carbs || 0)}g` },
                { label: 'vet', waarde: `${Math.round(infoTotaal?.fat || 0)}g` },
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
                {infoMeal.partner
                  ? 'Kant-en-klaar gerecht: de samenstelling staat op de website van de maker.'
                  : 'Van deze maaltijd staan geen ingrediënten in de database.'}
              </div>
            ) : (
              // Zelfde kaart als overal, ook voor de losse ingrediënten: je
              // ziet meteen wat het is en wat het bijdraagt.
              <div style={{ margin: '0 -1.25rem 1rem' }}>
                {infoRegels.map((ing, i) => (
                  <MealCard
                    key={`${ing.name}-${i}`}
                    meal={{
                      name: ing.name,
                      image_url: foodImageFallback(ing.name, null, 200),
                      calories: ing.calories, protein: ing.protein,
                      carbs: ing.carbs, fat: ing.fat,
                    }}
                    momentLabel=""
                    rechts={
                      <GramInvoer
                        waarde={ing.amount}
                        eenheid={ing.unit === 'gram' || !ing.unit ? 'g' : ing.unit}
                        stap={ing.unit === 'gram' || !ing.unit ? (stukVan(ing.name)?.grams || 10) : 1}
                        stuk={ing.unit === 'gram' || !ing.unit ? stukVan(ing.name) : null}
                        zet={(v) => setInfoGram(prev => ({ ...prev, [i]: v }))}
                      />
                    }
                    isMobile={isMobile}
                    acties={[]}
                  />
                ))}
              </div>
            )}

            <PartnerBestellen meal={infoMeal} isMobile={isMobile} style={{ marginBottom: '0.75rem' }} />
            {infoAangepast && (
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.55)', marginBottom: '0.6rem', lineHeight: 1.4 }}>
                Aangepast: wordt opgeslagen als "{/\(aangepast\)$/.test(infoMeal.name || '') ? infoMeal.name : `${infoMeal.name} (aangepast)`}" in Mijn maaltijden.
              </div>
            )}
            <button
              onClick={kiesUitInfo}
              disabled={infoBezig}
              style={{
                width: '100%', minHeight: 48, opacity: infoBezig ? 0.6 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                background: '#fff', border: 'none', borderRadius: 12,
                color: '#0a0a0a', fontSize: '0.9rem', fontWeight: 900,
                fontFamily: 'inherit', cursor: 'pointer',
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              }}
            >
              <Check size={15} strokeWidth={3} />
              {infoBezig ? 'Opslaan…' : infoAangepast ? 'Opslaan in mijn maaltijden en kies' : (embedded ? 'Loggen' : 'Kies deze')}
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
  return embedded ? inhoud : createPortal(inhoud, document.body)
}

// ── Single meal row in the list ──
// Een suggestie in het wisselvenster: dezelfde kaart als in de dagplanning,
// zodat je niet naar twee soorten maaltijdregels zit te kijken. Op de foto
// staat het verschil met de huidige maaltijd: kcal op de eerste regel, eiwit
// eronder. Dat zijn de twee waarop je een maaltijd inruilt. Geen "Eigen"-label
// meer voor eigen maaltijden: dat duwde het kcal-verschil van de foto af, en
// die staan al onder hun eigen filter.
//
// 27 okt 2026: compacter. Geen knoppenrij meer (tik op de kaart = kiezen,
// daarna de pop-up oud -> nieuw); info en hartje klein rechtsboven; het
// verschil met de huidige maaltijd als regel onder de naam in plaats van klein
// op de foto — dat is waar je op kiest.
function SuggestieKaart({ meal, currentMeal, isSelected, onSelect, isMobile, inMijnMaaltijden, onSter, onInfo, zonderVerschil = false }) {
  const teken = (n) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(n)}`
  const kcalOp = Math.round((meal.calories || 0) - (currentMeal?.calories || 0))
  const eiwitOp = Math.round((meal.protein || 0) - (currentMeal?.protein || 0))
  const verschil = zonderVerschil ? null : (
    <span>
      <span style={{ color: '#fff' }}>{kcalOp === 0 ? 'zelfde kcal' : `${teken(kcalOp)} kcal`}</span>
      {' · '}{eiwitOp === 0 ? 'zelfde eiwit' : `${teken(eiwitOp)}g eiwit`}
    </span>
  )
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
        slot: meal.slot || currentMeal?.slot,
        calories: meal.calories, protein: meal.protein,
        carbs: meal.carbs, fat: meal.fat,
      }}
      // Bij loggen is er geen maaltijd om mee te vergelijken: dan het moment
      // op de foto in plaats van "+520 kcal".
      label={meal.partner ? <PartnerLabel meal={meal} /> : null}
      momentLabel={zonderVerschil ? null : ''}
      ondertitel={verschil}
      compact
      isMobile={isMobile}
      geselecteerd={isSelected}
      onCheck={onSelect}
      onTik={onSelect}
      // Info rechts in het midden, het hartje in de hoek: twee knopjes naast
      // elkaar in de hoek liepen over de naam.
      rechts={
        <button onClick={(e) => { e.stopPropagation(); onInfo?.() }} aria-label="Info" style={{ ...hoek, opacity: 0.55, cursor: 'pointer', marginTop: 14 }}>
          <Info size={16} strokeWidth={2.4} />
        </button>
      }
      hoekKnop={
        <div style={{ display: 'flex' }}>
          <button
            onClick={(e) => { e.stopPropagation(); if (!inMijnMaaltijden) onSter?.() }}
            aria-label={inMijnMaaltijden ? 'Staat in jouw maaltijden' : 'Zet bij mijn maaltijden'}
            title={inMijnMaaltijden ? 'Staat al in jouw maaltijden' : 'Zet bij mijn maaltijden'}
            style={{ ...hoek, opacity: inMijnMaaltijden ? 1 : 0.55, cursor: inMijnMaaltijden ? 'default' : 'pointer' }}
          >
            <Heart size={15} strokeWidth={2.6} fill={inMijnMaaltijden ? '#fff' : 'none'} />
          </button>
        </div>
      }
      acties={[]}
    />
  )
}
