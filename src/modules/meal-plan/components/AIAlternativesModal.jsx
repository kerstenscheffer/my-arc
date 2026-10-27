// src/modules/meal-plan/components/AIAlternativesModal.jsx
// 🎯 v2.0 - Clean swap modal with smart suggestions & compare
// Props IDENTIEK: { isOpen, onClose, currentMeal, onSelectMeal, db, service }
import React, { useState, useEffect, useRef } from 'react'
import useZoekLog from './food-log/useZoekLog'
import MealCard from './day-schedule/MealCard'
import { foodImageFallback, resolveFoodImage } from '../foodImageFallback'
import { niveauVoorDoel, wisselNiveauVoorDoel } from '../DayTemplateService'
import { stukVan } from './food-log/portionPresets'
import PartnerBestellen, { PartnerLabel } from './PartnerBestellen'
import GramInvoer from './GramInvoer'
// Hetzelfde blad als de historie in het workout-log-scherm; één vorm voor
// "extra scherm dat vanaf onderen openschuift" in de hele app.
import BladModal from '../../workout/components/todays-workout/components/BladModal'
import { X, Search, Check, ArrowUp, ArrowDown, Minus, Heart, Plus, Info, SlidersHorizontal, ArrowRight, Utensils, ChevronDown, RefreshCw } from 'lucide-react'
import { createPortal } from '../../../client/paginaPortal'

// De secties van "Mijn maaltijden" heten anders dan de log-momenten hier.
const MOMENT_NAAR_SECTIE = {
  breakfast: 'ontbijt', lunch: 'lunch', dinner: 'diner',
  // 'snack' en niet 'snacks': oude app-versies kennen alleen 'snack'.
  snack: 'snack', post_workout: 'snack', pre_workout: 'pre_workout',
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
  // Na 'Wissel': de keuze waar het geldt (dagkiezer), in dit venster in
  // plaats van de lijst. Komt van de ouder, die ook het opslaan doet.
  waarInhoud = null,
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
  // Filters achter één knop (27 okt 2026): in beeld alleen het moment, de
  // rest in een blad. Wat afwijkt van de standaard staat als chipje in beeld.
  const [filterOpen, setFilterOpen] = useState(false)
  // Aangetikte maaltijd: verschijnt in de cirkel bovenaan, met een knop
  // onderaan om door te gaan (27 okt 2026).
  const [gekozen, setGekozen] = useState(null)
  // Ingeklapte groepen in de lijst (op kopje).
  const [dicht, setDicht] = useState(() => new Set())
  // Groep per maaltijd uit de laatste lijst (0 eigen, 1 aanrader, 2 rest),
  // voor de kopjes in de lijst.
  const laagRef = useRef(new Map())
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


  // Vier in plaats van zeven: meer kcal, zelfde eiwit en minder eiwit koos
  // bijna niemand (de sorteringen zelf blijven bestaan, zie hieronder).
  const sorteerOpties = [
    { id: 'smart', label: 'Beste match' },
    { id: 'less-cal', label: 'Minder kcal' },
    { id: 'more-protein', label: 'Meer eiwit' },
    { id: 'same-cal', label: 'Zelfde kcal' },
  ]

  // Wat staat er anders dan standaard? Die worden chipjes met een kruisje.
  const afwijkingen = [
    sortering !== 'smart' && { id: 'sort', label: sorteerOpties.find(o => o.id === sortering)?.label || 'Volgorde', terug: () => setSortering('smart') },
    maxKcal && { id: 'kcal', label: `max ${maxKcal} kcal`, terug: () => setMaxKcal('') },
    minEiwit && { id: 'eiwit', label: `min ${minEiwit}g eiwit`, terug: () => setMinEiwit('') },
  ].filter(Boolean)
  const allesTonen = () => { setMoment('alles'); setBron('alles'); setSortering('smart'); setMaxKcal(''); setMinEiwit('') }

  useEffect(() => {
    if ((isOpen || embedded) && currentMeal) {
      loadAlternatives()
    }
    return () => {
      setSelectedMeal(null)
      setGekozen(null)
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
            .select('id, name, calories, protein, carbs, fat, image_url, section, meal_type, ingredients_list')
            .eq('client_id', clientId)
            .eq('is_active', true)
          custom = (customData || []).map(m => ({ ...m, _isCustom: true }))

          // Bij welk moment hoort een eigen maaltijd zonder sectie? 81 van de
          // ~106 hebben er geen, en die stonden dan onder elk moment (bij
          // Diner ook je ontbijtwrap; Kersten, 27 okt 2026). Afgeleid uit
          // waar de klant hem logde: elk moment met minstens een kwart van
          // zijn logs telt. Geen logs = blijft overal staan.
          const zonder = custom.filter(m => !m.section)
          if (zonder.length) {
            const { data: logs } = await db.supabase
              .from('consumed_meals').select('meal_id, meal_name, meal_type')
              .eq('client_id', clientId)
              .gte('consumed_at', new Date(Date.now() - 365 * 864e5).toISOString())
              .then(r => r, () => ({ data: [] }))
            const NAAR = { breakfast: 'breakfast', lunch: 'lunch', dinner: 'dinner', snack: 'snack', pre_workout: 'pre_workout', post_workout: 'post_workout', avondsnack: 'avondsnack' }
            zonder.forEach(m => {
              const tel = {}
              let totaal = 0
              ;(logs || []).forEach(l => {
                const zelfde = l.meal_id === m.id || (l.meal_name || '').trim().toLowerCase() === (m.name || '').trim().toLowerCase()
                const mo = NAAR[String(l.meal_type || '').toLowerCase()]
                if (!zelfde || !mo) return
                tel[mo] = (tel[mo] || 0) + 1; totaal++
              })
              const momenten = Object.entries(tel).filter(([, n]) => n / totaal >= 0.25).map(([mo]) => mo)
              if (momenten.length) m._momenten = momenten
            })
          }
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
      // Eén lijst voor alles (zie getFilteredMeals); geen bron meer kiezen.
      setBron('alles')
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
    snack: 'snack', snacks: 'snack', tussendoortje: 'snack',
    // Secties van Mijn maaltijden (MyMealsTab) schrijven 'snacks' en
    // 'pre_workout'; post-workout valt daar onder snacks.
    pre_workout: 'pre_workout', post_workout: 'snack',
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
    // Eigen maaltijden: meal_type (meal prep zet ['snack']) en het afgeleide
    // moment uit de logs. 'custom' zegt niets over het moment.
    ;(Array.isArray(m?.meal_type) ? m.meal_type : []).forEach(t => { if (t && t !== 'custom') uit.add(String(t).toLowerCase()) })
    ;(m?._momenten || []).forEach(t => uit.add(t))
    return uit
  }


  const getFilteredMeals = () => {
    const currentCal = currentMeal?.calories || 0
    const currentProt = currentMeal?.protein || 0
    const nietZelf = (m) => m.id !== currentMeal?.id

    // 1. Eén lijst (27 okt 2026, Kersten): geen keuze meer waar je zoekt.
    //    Eerst je eigen maaltijden, dan de aanraders (vaste wisselopties en
    //    wat je coach zette: voor de klant hetzelfde), dan de rest van de
    //    database (kant-en-klaar zit daartussen). `laag` onthoudt de groep
    //    voor de volgorde en de kopjes. Het moment filtert eigen maaltijden
    //    en de database op timing; aanraders zijn al per moment gekozen.
    const pastMoment = (m) => {
      if (moment === 'alles') return true
      const set = momentenVan(m)
      return set.size === 0 || set.has(moment) || set.has(basisMoment(moment))
    }
    const aanraders = moment !== 'alles'
      ? [...(wisselPerMoment[basisMoment(moment)] || []),
         ...(coachPerMoment[moment]?.length ? coachPerMoment[moment] : (coachPerMoment[basisMoment(moment)] || []))]
      : [...Object.values(wisselPerMoment).flat(), ...coachOptions, ...Object.values(coachPerMoment).flat()]
    const gezienPool = new Set()
    const laag = new Map()
    const neem = (lijst, l) => lijst.filter(m => {
      if (!m || !nietZelf(m) || gezienPool.has(m.id)) return false
      gezienPool.add(m.id); laag.set(m.id, l)
      return true
    })
    laagRef.current = laag
    let pool = [
      ...neem(customMeals.filter(pastMoment), 0),
      ...neem(aanraders, 1),
      ...neem(allMeals.filter(pastMoment), 2),
    ]

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
        // Per groep: eigen maaltijden, aanraders (in hun eigen volgorde,
        // die staat op groep: Op brood, Wrap, …), dan de rest.
        const rang = new Map((alternatives || []).map((m, i) => [m.id, i]))
        const volg = new Map(meals.map((m, i) => [m.id, i]))
        return [...meals].sort((a, b) => {
          const la = laag.get(a.id) ?? 2, lb = laag.get(b.id) ?? 2
          if (la !== lb) return la - lb
          if (la === 1) return volg.get(a.id) - volg.get(b.id)
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
    // In de cirkel bovenaan; nog een keer tikken haalt hem eruit. Door naar
    // de pop-up oud -> nieuw gaat met de knop onderaan.
    setGekozen(prev => (prev?.id === meal.id ? null : meal))
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

  // Eigen maaltijd aangepast: die overschrijven (27 okt 2026). Met `kiezen`
  // daarna ook kiezen, anders alleen opslaan en het blad sluiten.
  const bewaarEigen = async (kiezen) => {
    if (!infoMeal?._isCustom || !db?.supabase) return
    setInfoBezig(true)
    try {
      const wijziging = {
        calories: Math.round(infoTotaal.calories || 0),
        protein: Math.round(infoTotaal.protein || 0),
        carbs: Math.round(infoTotaal.carbs || 0),
        fat: Math.round(infoTotaal.fat || 0),
        ingredients_list: infoRegels.filter(r => r.amount > 0),
        updated_at: new Date().toISOString(),
      }
      const { error } = await db.supabase.from('ai_custom_meals').update(wijziging).eq('id', infoMeal.id)
      if (error) throw error
      const nieuw = { ...infoMeal, ...wijziging }
      setCustomMeals(prev => prev.map(m => m.id === nieuw.id ? nieuw : m))
      setInfoMeal(null); setInfoIngredienten(null); setInfoGram({})
      if (kiezen) kies(nieuw)
    } catch (e) {
      console.error('Eigen maaltijd bijwerken mislukt:', e)
      alert('Kon je maaltijd niet opslaan.')
    } finally {
      setInfoBezig(false)
    }
  }

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
    if (infoMeal._isCustom) { await bewaarEigen(true); return }
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
  // Kopje boven een groep in de lijst: eigen maaltijden, de groep van een
  // aanrader (Op brood, Wrap, …), of de rest.
  const kopVan = (m) => {
    if (!m) return null
    const l = laagRef.current.get(m.id)
    if (l === 0) return 'Mijn maaltijden'
    if (l === 1) return groepVan(m) || 'Aanraders'
    return 'Meer maaltijden'
  }
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
                fontSize: '0.75rem', fontWeight: 800, color: 'rgba(255,255,255,0.5)', marginTop: 2, lineHeight: 1.25,
                maxWidth: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {currentMeal?.name || currentMeal?.meal_name}
              </div>
            </div>
            {/* Pijl op de hoogte van de cirkels */}
            <div style={{ height: 60, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
              <ArrowRight size={20} strokeWidth={2.8} color="#fff" />
            </div>
            {/* Nieuw: lege cirkel, of de aangetikte maaltijd die erin popt */}
            <div style={{ flex: '0 1 42%', minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              {gekozen ? (
                <div key={gekozen.id} style={{ width: '100%', minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', animation: 'altPopIn 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both' }}>
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

          {/* Gekozen: het verschil per macro en de knop om door te gaan, bovenin
              waar je toch al kijkt (eerst stond de knop onderaan). */}
          {gekozen && (
            <div key={`v-${gekozen.id}`} style={{ marginBottom: '0.9rem', animation: 'altFadeIn 0.25s ease both' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: isMobile ? 16 : 22 }}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: isMobile ? 16 : 26 }}>
                {[
                  { label: 'kcal', n: (gekozen.calories || 0) - (currentMeal?.calories || 0), kleur: '#10b981', g: '' },
                  { label: 'eiwit', n: (gekozen.protein || 0) - (currentMeal?.protein || 0), kleur: '#3b82f6', g: 'g' },
                  { label: 'koolh', n: (gekozen.carbs || 0) - (currentMeal?.carbs || 0), kleur: '#ec4899', g: 'g' },
                  { label: 'vet', n: (gekozen.fat || 0) - (currentMeal?.fat || 0), kleur: '#f59e0b', g: 'g' },
                ].map(m => {
                  const v = Math.round(m.n)
                  return (
                    <div key={m.label} style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1.05rem', fontWeight: 900, color: v === 0 ? 'rgba(255,255,255,0.45)' : '#fff', lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>
                        {v > 0 ? '+' : v < 0 ? '−' : ''}{Math.abs(v)}{m.g}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, marginTop: 3, fontSize: '0.58rem', fontWeight: 800, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: m.kleur }} />{m.label}
                      </div>
                    </div>
                  )
                })}
              </div>
              {/* Doorgaan: wit wissel-icoon rechts op de macro-regel. */}
              {!waarInhoud && (
                <button onClick={() => onSelectMeal?.(gekozen.id)} aria-label="Wissel" title="Wissel" style={{
                  // Zo hoog als een macro (getal + label ernaast).
                  flexShrink: 0, width: 40, height: 40, borderRadius: '50%', padding: 0,
                  background: '#fff', border: 'none', color: '#0a0a0a',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                }}>
                  <RefreshCw size={20} strokeWidth={3} />
                </button>
              )}
              </div>
            </div>
          )}
          </>)}

          {!waarInhoud && (<>
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
          {/* Moment als pilletjes (de gekozen wit) en één filterknop. */}
          <div style={{ display: 'flex', alignItems: 'center', margin: isMobile ? '0 -1rem' : '0 -1.5rem' }}>
            <div style={{ flex: 1, minWidth: 0, display: 'flex', gap: 2, overflowX: 'auto', scrollbarWidth: 'none', padding: isMobile ? '0 0 0 1rem' : '0 0 0 1.5rem' }}>
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
              {afwijkingen.map(a => (
                <button key={a.id} onClick={a.terug} style={{
                  display: 'flex', alignItems: 'center', gap: 5, height: 28, padding: '0 0.55rem 0 0.75rem',
                  borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff',
                  fontSize: '0.74rem', fontWeight: 800, fontFamily: 'inherit', cursor: 'pointer',
                  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                }}>
                  {a.label} <X size={13} strokeWidth={3} />
                </button>
              ))}
            </div>
          )}
          </>)}
        </div>

        {/* ── Meal List ── */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch'
        }}>
          {waarInhoud ? (
            <div style={{ padding: isMobile ? '0.9rem 1rem calc(1.2rem + env(safe-area-inset-bottom, 0px))' : '1rem 1.5rem 1.5rem', animation: 'altFadeIn 0.2s ease both' }}>
              {waarInhoud}
            </div>
          ) : loading ? (
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
          ) : filteredMeals.length > 0 ? (<>
            {searchTerm.trim() && (
              <div style={{ padding: `0.6rem ${isMobile ? '1rem' : '1.5rem'} 0.2rem`, fontSize: '0.7rem', fontWeight: 800, color: 'rgba(255,255,255,0.45)' }}>
                Gezocht in alle maaltijden
              </div>
            )}
            {filteredMeals.map((meal, idx) => (
              <React.Fragment key={meal.id || idx}>
              {sortering === 'smart' && !searchTerm && kopVan(meal)
                && kopVan(meal) !== kopVan(filteredMeals[idx - 1]) && (
                <div onClick={() => setDicht(prev => { const n = new Set(prev); const k = kopVan(meal); if (n.has(k)) n.delete(k); else n.add(k); return n })} style={{
                  display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
                  WebkitTapHighlightColor: 'transparent', userSelect: 'none',
                  padding: `${idx === 0 ? '0.2rem' : '0.9rem'} ${isMobile ? '0.9rem' : '1.25rem'} 0.35rem`,
                  fontSize: '0.68rem', fontWeight: 900, letterSpacing: '0.06em',
                  textTransform: 'uppercase', color: 'rgba(255,255,255,0.75)',
                }}>
                  {kopVan(meal)}
                  <ChevronDown size={14} strokeWidth={3} style={{ transition: 'transform 0.15s ease', transform: dicht.has(kopVan(meal)) ? 'rotate(-90deg)' : 'none' }} />
                </div>
              )}
              {!(sortering === 'smart' && !searchTerm && dicht.has(kopVan(meal))) && <SuggestieKaart
                meal={meal}
                currentMeal={currentMeal}
                isSelected={gekozen?.id === meal.id}
                onSelect={() => kies(meal)}
                zonderVerschil={embedded}
                isMobile={isMobile}
                inMijnMaaltijden={meal._isCustom || staatInMijnMaaltijden(meal)}
                onSter={() => setSterMeal(meal)}
                onInfo={() => openInfo(meal)}
              />}
              </React.Fragment>
            ))}
            {/* Vangnet: weinig uitkomst door filters? Eén tik en alles staat er. */}
            {!searchTerm.trim() && filteredMeals.length < 6 && (moment !== 'alles' || afwijkingen.length > 0 || bron !== 'alles') && (
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
                  Zoek overal
                </button>
              )}
            </div>
          )}

          {/* Eigen maaltijden: de weg naar het aanmaakscherm hoort onderaan de
              lijst waar je 'm mist. */}
          {/* Eigen maaltijd maken: onderaan de lijst, nu er geen aparte
              'Mijn maaltijden'-lijst meer is. */}
          {onMaaltijdAanmaken && !loading && !searchTerm.trim() && !waarInhoud && (
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
            {/* Macro's: vier getallen met een stipje, geen vakken (zoals loggen). */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 26, marginBottom: '1.1rem' }}>
              {[
                { label: 'kcal', waarde: Math.round(infoTotaal?.calories || 0), kleur: '#10b981' },
                { label: 'eiwit', waarde: `${Math.round(infoTotaal?.protein || 0)}g`, kleur: '#3b82f6' },
                { label: 'koolh', waarde: `${Math.round(infoTotaal?.carbs || 0)}g`, kleur: '#ec4899' },
                { label: 'vet', waarde: `${Math.round(infoTotaal?.fat || 0)}g`, kleur: '#f59e0b' },
              ].map(m => (
                <div key={m.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#fff', lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>{m.waarde}</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, marginTop: 4, fontSize: '0.6rem', fontWeight: 800, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: m.kleur }} />{m.label}
                  </div>
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
            {infoAangepast && !infoMeal._isCustom && (
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
              {infoBezig ? 'Opslaan…'
                : infoAangepast ? (infoMeal._isCustom ? 'Opslaan en kies' : 'Opslaan in mijn maaltijden en kies')
                : (embedded ? 'Loggen' : 'Kies deze')}
            </button>
            {/* Eigen maaltijd aangepast: ook alleen opslaan, zonder te kiezen. */}
            {infoAangepast && infoMeal._isCustom && (
              <button onClick={() => bewaarEigen(false)} disabled={infoBezig} style={{
                width: '100%', minHeight: 42, marginTop: 6, background: 'none', border: 'none',
                color: '#fff', fontSize: '0.85rem', fontWeight: 900, fontFamily: 'inherit', cursor: 'pointer',
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              }}>Alleen opslaan</button>
            )}
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

      {/* Filterblad: wat je ziet (bron), in welke volgorde, en grenzen. */}
      <BladModal open={filterOpen} titel="Filter" onClose={() => setFilterOpen(false)} zIndex={10600}>
        {[
          { kop: 'Volgorde', opties: sorteerOpties, waarde: sortering, zet: setSortering },
        ].map(blok => (
          <div key={blok.kop} style={{ marginBottom: '1.1rem' }}>
            <div style={{ fontSize: '0.62rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{blok.kop}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {blok.opties.map(o => {
                const aan = blok.waarde === o.id
                return (
                  <button key={o.id} onClick={() => blok.zet(o.id)} style={{
                    height: 34, padding: '0 0.85rem', borderRadius: 999,
                    background: aan ? '#fff' : 'rgba(255,255,255,0.06)', border: 'none',
                    color: aan ? '#0a0a0a' : 'rgba(255,255,255,0.75)',
                    fontSize: '0.8rem', fontWeight: 900, fontFamily: 'inherit', cursor: 'pointer',
                    touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                  }}>{o.id === 'alles' ? 'Alles' : o.label}</button>
                )
              })}
            </div>
          </div>
        ))}
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
        @keyframes altPopIn {
          0% { transform: translateY(26px) scale(0.4); opacity: 0; }
          60% { opacity: 1; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
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
      // Hartje en info onder elkaar in een eigen kolom rechts: zelfde maat,
      // zelfde afstand. Eerst stond het hartje in de hoek en info half
      // eronder, en dat zag er scheef uit.
      rechts={
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, marginRight: -6 }}>
          <button
            onClick={(e) => { e.stopPropagation(); if (!inMijnMaaltijden) onSter?.() }}
            aria-label={inMijnMaaltijden ? 'Staat in jouw maaltijden' : 'Zet bij mijn maaltijden'}
            title={inMijnMaaltijden ? 'Staat al in jouw maaltijden' : 'Zet bij mijn maaltijden'}
            style={{ ...hoek, opacity: inMijnMaaltijden ? 1 : 0.55, cursor: inMijnMaaltijden ? 'default' : 'pointer' }}
          >
            <Heart size={16} strokeWidth={2.6} fill={inMijnMaaltijden ? '#fff' : 'none'} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onInfo?.() }} aria-label="Info" style={{ ...hoek, opacity: 0.55, cursor: 'pointer' }}>
            <Info size={16} strokeWidth={2.6} />
          </button>
        </div>
      }
      acties={[]}
    />
  )
}
