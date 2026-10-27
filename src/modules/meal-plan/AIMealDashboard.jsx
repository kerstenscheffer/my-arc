// src/modules/meal-plan/AIMealDashboard.jsx
// ✅ OPTIMISTIC UPDATES - Instant UI zonder hard refresh
// ✅ v6.1 - Fixed: Zero top padding, MacroOverview flush
// ✅ v6.2 - Added: SupplementPlanPanel integration
// ✅ v6.3 - Fixed: Supplement button styled to match dashboard design
import React, { useState, useEffect } from 'react'
import { createPortal } from '../../client/paginaPortal'
import { MaaltijdSkelet } from '../../client/PaginaSkeletten'
import usePaginaTerug from '../../client/usePaginaTerug'
import AIMealPlanService from './AIMealPlanService'

// Core Components
import AIDaySchedule from './components/AIDaySchedule'
import DagTemplatePaneel from './components/DagTemplatePaneel'
import ShoppingHub from '../shopping/ShoppingHub'
import { ShoppingCart, X, Eye, EyeOff, BarChart3 } from 'lucide-react'
import AIWeekPlanner from './components/AIWeekPlanner'
import MealSetupWizard from './components/wizard/MealSetupWizard'

// New (overhaul) — header + macro hero + more sheet
import MealDayNavHeader from './components/MealDayNavHeader'
import MealDaySummaryModal from './components/MealDaySummaryModal'
import MacroHero from './components/MacroHero'
import { dagVenster } from './utils/dagVenster'
import MealLogFAB from './components/MealLogFAB'
import DonePanel from './components/DonePanel'
import MoreActionsSheet from './components/MoreActionsSheet'
// `RemainingPill` is verwijderd uit de UI (kcal-totaal staat al in MacroHero
// + nieuwe samenvattingsmodal). `resolveMealMode` / `updateMealMode` zijn
// ook weg — Plan/Free toggle is geschrapt; we tonen altijd plan-mode.

// Day-of-week metadata used by both the lifted DaySelector and downstream timeline.
const DAYS_OF_WEEK = [
  { id: 0, name: 'Ma', key: 'monday' },
  { id: 1, name: 'Di', key: 'tuesday' },
  { id: 2, name: 'Wo', key: 'wednesday' },
  { id: 3, name: 'Do', key: 'thursday' },
  { id: 4, name: 'Vr', key: 'friday' },
  { id: 5, name: 'Za', key: 'saturday' },
  { id: 6, name: 'Zo', key: 'sunday' },
]
// Kop van de voedingspagina: foto die onderin dood loopt in het zwart, met de
// titel eroverheen. Zelfde vorm als de kop van de workout-pagina, zodat de
// twee pagina's op elkaar lijken.

const MEAL_BANNER_URL = 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1200&h=700&fit=crop&q=80'

const getTodayIndex = () => {
  const day = new Date().getDay()
  return day === 0 ? 6 : day - 1
}
const dayKeyToIndex = (key) => {
  if (key === 'today' || !key) return getTodayIndex()
  const i = DAYS_OF_WEEK.findIndex(d => d.key === key)
  return i >= 0 ? i : getTodayIndex()
}
const indexToDate = (idx, weekOffset = 0) => {
  const todayIdx = getTodayIndex()
  const date = new Date()
  date.setDate(date.getDate() + (idx - todayIdx) + weekOffset * 7)
  return date
}

// Challenge Sidebar
import MealChallengeSidebar from '../../client/components/MealChallengeSidebar'
import ChallengeProgressTab from '../challenge-monitor/ChallengeProgressTab'
import BelangrijkeVideo from '../../client/components/BelangrijkeVideo'

// Modals
import AIAlternativesModal from './components/AIAlternativesModal'
import { resolveFoodImage } from './foodImageFallback'
import DagenKiezer from './components/DagenKiezer'
import { weekplanVoorWeek } from './DayTemplateService'
import { zetMaaltijdOpDagen, haalMaaltijdWegOpDagen, zetPreWorkoutOpTrainingsdagen } from './dagAanpassingen'
import { isTrainingsdag, preWorkoutUitDag, PRE_WORKOUT_SLOT } from './utils/preWorkoutMeal'
import AIMealInfoModal from './components/AIMealInfoModal'
import AIFavoritesModal from './components/AIFavoritesModal'
import AIMealHistoryModal from './components/AIMealHistoryModal'

// Video Widget

// ✅ NIEUW: Supplement Panel
import SupplementPlanPanel from '../supplements/SupplementPlanPanel'

// Coach meal suggestions slider (issue f57b5a95)

// ✅ NIEUW: Weekly Nutrition Overview
import WeeklyNutritionOverview from './components/food-log/WeeklyNutritionOverview'

// ✅ NIEUW: Client Documents (PDF viewer)
import ClientDocumentsSection from '../coach-command-center/components/insight/ClientDocumentsSection'

export default function AIMealDashboard({ client, onNavigate, db, alleenKijken = false }) {
  const [service] = useState(() => new AIMealPlanService(db))
  const isMobile = window.innerWidth <= 768
  
  const [loading, setLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState(null)
  const [selectedDay, setSelectedDay] = useState('today')
  // Gaat omhoog zodra er een dagtemplate is toegepast. De dagweergave luistert
  // daarnaar en haalt zijn dag opnieuw op, zodat je meteen het nieuwe eten
  // ziet in plaats van het oude tot je de pagina ververst.
  const [dagRefreshKey, setDagRefreshKey] = useState(0)
  // De boodschappenlijst hoort bij je eten, niet in een apart tabblad achter
  // "Meer". Hij opent nu vanaf de kop van deze pagina.
  const [shopOpen, setShopOpen] = useState(false)
  // Het dagen-paneel wordt nu geopend vanaf de dagnaam in de kop, niet meer
  // vanaf een tab tegen de linkerrand van het scherm.
  const [dagenOpen, setDagenOpen] = useState(false)
  const [showWeekPlanner, setShowWeekPlanner] = useState(false)
  const [showWizard, setShowWizard] = useState(false)
  // Counter dat AIDaySchedule's FoodLogModal triggert wanneer de FAB
  // wordt ingedrukt. Increment = open.
  const [foodLogTrigger, setFoodLogTrigger] = useState(0)
  // Tabblad waarop het log-venster opent: 'search' vanaf de ronde knop,
  // 'meals' vanuit "Maaltijd aanmaken" in het wisselvenster.
  const [foodLogTab, setFoodLogTab] = useState('search')
  // Weken vooruit of terug, gestuurd door de pijlen in de kop.
  const [weekOffset, setWeekOffset] = useState(0)
  
  const [modals, setModals] = useState({
    alternatives: null,
    info: null,
    history: false,
    summary: false,
    favorites: false,
    supplements: false,
    weekOverview: false,
    more: false,
    documents: false,
  })

  // Incremented when a meal is logged/deleted on a past day; causes MacroHero
  // to clear its day-cache and re-fetch fresh totals for that day.
  const [pastDayRefreshKey, setPastDayRefreshKey] = useState(0)
  // Zie kiesWissel: een halve seconde niets doorlaten na het wisselen.
  const [naWisselSchild, setNaWisselSchild] = useState(false)

  // Meal view mode: standaard 'plan' (toont plan-slots). Als het meal-plan is
  // uitgeschakeld (`clients.meal_plan_visible = false`) valt 'm terug op 'free'
  // — food-logging blijft werken, alleen de geplande slots verdwijnen. De coach
  // kan dit togglen via client-insight; de client zelf via de knop op deze pagina.
  const [mealPlanVisible, setMealPlanVisible] = useState(client?.meal_plan_visible !== false)
  const [savingVisibility, setSavingVisibility] = useState(false)
  useEffect(() => { setMealPlanVisible(client?.meal_plan_visible !== false) }, [client?.meal_plan_visible])
  // Zonder actief plan altijd de vrije stand: eten loggen, water, macro's
  // uit het profiel. Eerder verving een lege staat de hele pagina ("Geen
  // actief meal plan"); dat is weg (issue 9 okt 2026).
  const heeftPlan = !!dashboardData?.activePlan
  const mealMode = (mealPlanVisible && heeftPlan) ? 'plan' : 'free'

  const toggleMealPlanVisible = async () => {
    if (savingVisibility || !client?.id) return
    const next = !mealPlanVisible
    setMealPlanVisible(next)
    setSavingVisibility(true)
    try {
      const { error } = await db.supabase.from('clients').update({ meal_plan_visible: next }).eq('id', client.id)
      if (error) throw error
    } catch (e) {
      console.error('meal_plan_visible update failed:', e)
      setMealPlanVisible(!next) // rollback
    }
    setSavingVisibility(false)
  }
  
  useEffect(() => {
    if (client?.id) {
      loadDashboardData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client?.id])

  // Past de coach de macro's aan terwijl dit scherm openstaat, dan hoort dit
  // mee te bewegen. De targets worden hier vers uit de database gehaald, maar
  // alleen bij het laden — zonder dit bleef de ring het oude doel tonen tot
  // iemand de pagina verversde.
  useEffect(() => {
    const opWijziging = (e) => {
      if (!client?.id || e?.detail?.clientId !== client.id) return
      loadDashboardData()
    }
    window.addEventListener('myarc:macros-gewijzigd', opWijziging)
    return () => window.removeEventListener('myarc:macros-gewijzigd', opWijziging)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client?.id])
  // Terug op Voeding: de pagina bleef staan, maar op Home kan intussen een
  // maaltijd zijn afgevinkt. Stil verversen (geen skelet, dashboardData is er al).
  usePaginaTerug('meal', () => { if (client?.id) loadDashboardData() })
  
  const loadDashboardData = async () => {
    console.log('🚀 Loading AI dashboard data')
    // Alleen het volle laadscherm bij de eerste keer. Bij een herlaadbeurt
    // (na een wissel of een log) bleef anders het hele dagoverzicht even weg
    // en werd het daarna opnieuw opgebouwd — met alle bijwerkingen van dien.
    if (!dashboardData) setLoading(true)
    
    try {
      // Dashboard, verse macrodoelen en wat er vandaag gegeten is tegelijk
      // ophalen; die laatste twee wachtten eerst op het dashboard.
      const [data, versDoel, realConsumed] = await Promise.all([
        service.loadAIDashboardData(client.id),
        db.supabase.from('clients')
          .select('target_calories, target_protein, target_carbs, target_fat')
          .eq('id', client.id).single()
          .then(r => r, () => ({ data: null })),
        calculateConsumedFromDB(),
      ])
      
      if (data.dailyTotals) {
        // Fresh targets from DB — not cached client prop
        let planTargets = {
          calories: client.target_calories || 0,
          protein: client.target_protein || 0,
          carbs: client.target_carbs || 0,
          fat: client.target_fat || 0
        }
        const fc = versDoel?.data
        if (fc) {
          planTargets = {
            calories: fc.target_calories || planTargets.calories,
            protein: fc.target_protein || planTargets.protein,
            carbs: fc.target_carbs || planTargets.carbs,
            fat: fc.target_fat || planTargets.fat
          }
        }
        
        data.dailyTotals.targets = planTargets
        data.dailyTotals.consumed = realConsumed
        
        data.dailyTotals.percentages = {
          calories: planTargets.calories > 0 ? Math.round((realConsumed.calories / planTargets.calories) * 100) : 0,
          protein: planTargets.protein > 0 ? Math.round((realConsumed.protein / planTargets.protein) * 100) : 0,
          carbs: planTargets.carbs > 0 ? Math.round((realConsumed.carbs / planTargets.carbs) * 100) : 0,
          fat: planTargets.fat > 0 ? Math.round((realConsumed.fat / planTargets.fat) * 100) : 0
        }
      }
      
      if (!data.nextMeal && data.todayMeals?.length > 0) {
        const unconsumedMeal = data.todayMeals.find(meal => !meal.isConsumed)
        if (unconsumedMeal) {
          data.nextMeal = unconsumedMeal
        }
      }
      
      setDashboardData(data)
      console.log('✅ AI Dashboard loaded')
      console.log('📊 Daily Totals:', data.dailyTotals)
    } catch (error) {
      console.error('Failed to load dashboard:', error)
      setDashboardData({
        activePlan: null,
        todayMeals: [],
        nextMeal: null,
        todayProgress: null,
        dailyTotals: {
          targets: { 
            calories: client.target_calories || 0, 
            protein: client.target_protein || 0, 
            carbs: client.target_carbs || 0, 
            fat: client.target_fat || 0 
          },
          consumed: { calories: 0, protein: 0, carbs: 0, fat: 0 },
          percentages: { calories: 0, protein: 0, carbs: 0, fat: 0 },
          mealsConsumed: 0,
          mealsPlanned: 0
        },
        waterIntake: 0,
        todayMood: null,
        favorites: [],
        customMeals: [],
        recentHistory: []
      })
    } finally {
      setLoading(false)
    }
  }
  
  const calculateConsumedFromDB = async () => {
    // Lokale dag, zelfde venster als de tijdlijn (zie utils/dagVenster).
    const { vanaf, tot } = dagVenster(new Date())
   
    let totalConsumed = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0
    }
   
    try {
      // Single source of truth: consumed_meals table
      const { data: consumedData, error: consumedError } = await db.supabase
        .from('consumed_meals')
        .select('calories, protein, carbs, fat')
        .eq('client_id', client.id)
        .gte('consumed_at', vanaf)
        .lt('consumed_at', tot)

      if (!consumedError && consumedData) {
        consumedData.forEach(meal => {
          totalConsumed.calories += meal.calories || 0
          totalConsumed.protein += parseFloat(meal.protein) || 0
          totalConsumed.carbs += parseFloat(meal.carbs) || 0
          totalConsumed.fat += parseFloat(meal.fat) || 0
        })
        console.log('✅ Consumed from DB:', consumedData.length, 'meals, total:', totalConsumed.calories, 'kcal')
      }

      return totalConsumed
   
    } catch (error) {
      console.error('Error calculating consumed:', error)
      return totalConsumed
    }
  }
  
  const handleMealLogged = async (loggedData) => {
    console.log('✅ [OPTIMISTIC] Meal logged:', loggedData)

    setDashboardData(prev => {
      if (!prev?.dailyTotals) return prev
      const newConsumed = {
        calories: prev.dailyTotals.consumed.calories + (loggedData.calories || 0),
        protein: prev.dailyTotals.consumed.protein + (loggedData.protein || 0),
        carbs: prev.dailyTotals.consumed.carbs + (loggedData.carbs || 0),
        fat: prev.dailyTotals.consumed.fat + (loggedData.fat || 0)
      }
      
      const targets = prev.dailyTotals.targets
      
      return {
        ...prev,
        dailyTotals: {
          ...prev.dailyTotals,
          consumed: newConsumed,
          percentages: {
            calories: targets.calories > 0 ? Math.round((newConsumed.calories / targets.calories) * 100) : 0,
            protein: targets.protein > 0 ? Math.round((newConsumed.protein / targets.protein) * 100) : 0,
            carbs: targets.carbs > 0 ? Math.round((newConsumed.carbs / targets.carbs) * 100) : 0,
            fat: targets.fat > 0 ? Math.round((newConsumed.fat / targets.fat) * 100) : 0
          }
        }
      }
    })
    
    console.log('✅ [OPTIMISTIC] UI updated instantly')
  }
  
  const handleCheckMeal = async (slot, mealData) => {
    console.log('✅ [OPTIMISTIC] Checking meal:', slot, mealData)

    setDashboardData(prev => {
      if (!prev?.dailyTotals) return prev
      const newConsumed = {
        calories: prev.dailyTotals.consumed.calories + (mealData.calories || 0),
        protein: prev.dailyTotals.consumed.protein + (mealData.protein || 0),
        carbs: prev.dailyTotals.consumed.carbs + (mealData.carbs || 0),
        fat: prev.dailyTotals.consumed.fat + (mealData.fat || 0)
      }
      
      const targets = prev.dailyTotals.targets
      
      const updatedTodayMeals = prev.todayMeals?.map(meal => 
        meal.slot === slot ? { ...meal, isConsumed: true } : meal
      ) || []
      
      const nextUnconsumedMeal = updatedTodayMeals.find(meal => !meal.isConsumed)
      
      return {
        ...prev,
        todayMeals: updatedTodayMeals,
        nextMeal: nextUnconsumedMeal || null,
        dailyTotals: {
          ...prev.dailyTotals,
          consumed: newConsumed,
          percentages: {
            calories: targets.calories > 0 ? Math.round((newConsumed.calories / targets.calories) * 100) : 0,
            protein: targets.protein > 0 ? Math.round((newConsumed.protein / targets.protein) * 100) : 0,
            carbs: targets.carbs > 0 ? Math.round((newConsumed.carbs / targets.carbs) * 100) : 0,
            fat: targets.fat > 0 ? Math.round((newConsumed.fat / targets.fat) * 100) : 0
          },
          mealsConsumed: (prev.dailyTotals.mealsConsumed || 0) + 1
        }
      }
    })
    
    try {
      await service.checkAIMeal(
        client.id,
        dashboardData.activePlan?.id,
        slot,
        mealData
      )
      console.log('✅ [OPTIMISTIC] Meal check saved to DB')
    } catch (error) {
      console.error('❌ [OPTIMISTIC] Meal check failed, reverting...', error)
      await loadDashboardData()
    }
  }
  
  // `mealData` is de maaltijd die de klant aantikte. Die telt af, en niet de
  // maaltijd die toevallig op datzelfde slot in todayMeals staat.
  //
  // Dat was de bug: afvinken telde de aangetikte maaltijd óp, ongedaan maken
  // zocht er zelf een bij het slot. Staat daar iets anders — bijvoorbeeld
  // omdat de dag een dagtemplate kreeg en todayMeals nog het weekplan had —
  // dan trok hij een ander bedrag af en bleef het verschil staan. Vond hij
  // niets, dan gebeurde er helemaal niets en bleven de macro's staan terwijl
  // het vinkje wel uit ging.
  const handleUncheckMeal = async (slot, mealData = null) => {
    console.log('❌ [OPTIMISTIC] Unchecking meal:', slot)

    const mealToUncheck = mealData || dashboardData.todayMeals?.find(m => m.slot === slot)
    if (!mealToUncheck) {
      // Niets om mee te rekenen: dan liever opnieuw ophalen dan de teller
      // laten staan.
      await loadDashboardData()
      return
    }
    
    setDashboardData(prev => {
      if (!prev?.dailyTotals) return prev
      const newConsumed = {
        calories: Math.max(0, prev.dailyTotals.consumed.calories - (mealToUncheck.calories || 0)),
        protein: Math.max(0, prev.dailyTotals.consumed.protein - (mealToUncheck.protein || 0)),
        carbs: Math.max(0, prev.dailyTotals.consumed.carbs - (mealToUncheck.carbs || 0)),
        fat: Math.max(0, prev.dailyTotals.consumed.fat - (mealToUncheck.fat || 0))
      }
      
      const targets = prev.dailyTotals.targets
      
      const updatedTodayMeals = prev.todayMeals?.map(meal => 
        meal.slot === slot ? { ...meal, isConsumed: false } : meal
      ) || []
      
      let newNextMeal = prev.nextMeal
      
      if (!prev.nextMeal || prev.nextMeal.slot === slot) {
        newNextMeal = updatedTodayMeals.find(meal => !meal.isConsumed) || null
      } else if (mealToUncheck.isConsumed) {
        newNextMeal = updatedTodayMeals.find(meal => !meal.isConsumed) || null
      }
      
      return {
        ...prev,
        todayMeals: updatedTodayMeals,
        nextMeal: newNextMeal,
        dailyTotals: {
          ...prev.dailyTotals,
          consumed: newConsumed,
          percentages: {
            calories: targets.calories > 0 ? Math.round((newConsumed.calories / targets.calories) * 100) : 0,
            protein: targets.protein > 0 ? Math.round((newConsumed.protein / targets.protein) * 100) : 0,
            carbs: targets.carbs > 0 ? Math.round((newConsumed.carbs / targets.carbs) * 100) : 0,
            fat: targets.fat > 0 ? Math.round((newConsumed.fat / targets.fat) * 100) : 0
          },
          mealsConsumed: Math.max(0, (prev.dailyTotals.mealsConsumed || 0) - 1)
        }
      }
    })
    
    try {
      await service.uncheckAIMeal(
        client.id,
        dashboardData.activePlan?.id,
        slot
      )
      console.log('✅ [OPTIMISTIC] Meal uncheck saved to DB')
    } catch (error) {
      console.error('❌ [OPTIMISTIC] Meal uncheck failed, reverting...', error)
      await loadDashboardData()
    }
  }
  
  // Wissel uit het alternatieven-venster: eerst kiezen op welke dagen het
  // geldt (DagenKiezer), dan pas opslaan via voerWisselUit.
  const [wisselKeuze, setWisselKeuze] = useState(null) // { meal, nieuw }
  const [wisselBezig, setWisselBezig] = useState(false)
  const [wisselFout, setWisselFout] = useState(null)

  // `inline`: vanuit het wisselscherm. Dat blijft open en toont de keuze
  // waar het geldt zelf (27 okt 2026); anders de losse pop-up.
  const kiesWissel = async (originalMeal, newMealId, { inline = false } = {}) => {
    if (!inline) {
      setModals(prev => ({ ...prev, alternatives: null, favorites: false }))
      setNaWisselSchild(true)
      setTimeout(() => setNaWisselSchild(false), 500)
    }
    const nieuw = await service.getMealById(newMealId)
    if (!nieuw) { console.error('Wissel: maaltijd niet gevonden', newMealId); return }
    setWisselFout(null)
    setWisselKeuze({ meal: originalMeal, nieuw, inline })
  }

  // Prullenbakje op een planmaaltijd: zelfde dagkiezer, dan weghalen.
  const [verwijderMeal, setVerwijderMeal] = useState(null)

  // Trainingsdagen vers (komt met elke dashboard-lading mee, ook bij terug
  // naar deze pagina). client.workout_schedule is van bij het openen van de
  // app: training verzet op Workout = pre-workout bleef op de oude dag
  // (Kersten, 27 okt 2026).
  const trainingsSchema = dashboardData?.workoutSchedule ?? client?.workout_schedule

  // Op welke dagen staat deze maaltijd op hetzelfde moment? Voor de stippen in
  // de dagkiezer. maandag = null: het vaste weekplan; anders die week, met de
  // losse dag-aanpassingen erover. Zelfde maaltijd = zelfde id, of bij oude
  // planregels zonder id dezelfde naam.
  const dagenMetMaaltijd = (meal) => async (maandag) => {
    const basis = dashboardData?.activePlan?.week_structure
    if (!meal?.slot || !basis) return []
    const week = maandag ? await weekplanVoorWeek(db.supabase, client.id, basis, maandag) : basis
    const id = meal.meal_id || meal.id
    const naam = (meal.name || meal.meal_name || '').trim().toLowerCase()
    const zelfde = (m) => {
      if (!m || typeof m !== 'object') return false
      const mid = m.meal_id || m.id
      return id && mid ? String(mid) === String(id) : (m.name || '').trim().toLowerCase() === naam
    }
    const planPre = dashboardData?.activePlan?.pre_workout_meal
    return DAYS_OF_WEEK.map(d => d.key).filter(k => {
      const m = week?.[k]?.[meal.slot]
      if (m && typeof m === 'object') return zelfde(m)
      // Pre-workout van het plan: op trainingsdagen zonder eigen slot.
      return meal.slot === PRE_WORKOUT_SLOT && zelfde(planPre) && !preWorkoutUitDag(planPre, k)
        && isTrainingsdag(trainingsSchema, k, week?.[k])
    })
  }

  // Pre-workout hoort bij de training: alleen trainingsdagen zijn te kiezen.
  // Zelfde bron als de tijdlijn en Home (clients.workout_schedule).
  const trainingsdagenVoor = (meal) => meal?.slot === PRE_WORKOUT_SLOT
    ? DAYS_OF_WEEK.map(d => d.key).filter(k => isTrainingsdag(trainingsSchema, k, dashboardData?.activePlan?.week_structure?.[k]))
    : null
  const voerVerwijderUit = async (keuze) => {
    if (!verwijderMeal) return
    const slot = verwijderMeal.slot
    setWisselBezig(true); setWisselFout(null)
    try {
      if (keuze.modus === 'altijd') {
        await haalMaaltijdWegOpDagen(db.supabase, dashboardData.activePlan?.id, keuze.dagen, slot)
      } else {
        for (const d of keuze.datums) await service.verwijderMealOpDatum(client.id, slot, d)
      }
      setVerwijderMeal(null)
      setPastDayRefreshKey(k => k + 1)
      await loadDashboardData()
    } catch (e) {
      console.error('Verwijderen mislukt:', e)
      setWisselFout(e?.message || 'Verwijderen mislukt')
    } finally {
      setWisselBezig(false)
    }
  }

  const voerWisselUit = async (keuze) => {
    if (!wisselKeuze) return
    const { meal, nieuw } = wisselKeuze
    const slot = meal.slot
    setWisselBezig(true); setWisselFout(null)
    try {
      const snap = { ...nieuw, meal_id: nieuw.id, meal_name: nieuw.name || nieuw.meal_name }
      // Porties van de vorige maaltijd horen niet mee (zie swapMealInWeekStructure).
      ;['original_calories', 'original_protein', 'original_carbs', 'original_fat', 'fitScore'].forEach(k => { delete snap[k] })
      if (keuze.modus === 'altijd' && slot === PRE_WORKOUT_SLOT) {
        // Op elke trainingsdag, meeschuivend met de training.
        await zetPreWorkoutOpTrainingsdagen(db.supabase, dashboardData.activePlan?.id, snap)
        if (keuze.dagen.includes(DAYS_OF_WEEK[getTodayIndex()]?.key)) {
          await service.wisDagAanpassing(client.id, slot, null)
        }
      } else if (keuze.modus === 'altijd') {
        await zetMaaltijdOpDagen(db.supabase, dashboardData.activePlan?.id, keuze.dagen, slot, snap)
        // Een oudere eenmalige wissel op vandaag zou de blijvende verbergen.
        if (keuze.dagen.includes(DAYS_OF_WEEK[getTodayIndex()]?.key)) {
          await service.wisDagAanpassing(client.id, slot, null)
        }
      } else {
        for (const d of keuze.datums) await service.overrideMealForDate(client.id, slot, snap, d)
      }
      setWisselKeuze(null)
      setModals(prev => ({ ...prev, alternatives: null }))
      setPastDayRefreshKey(k => k + 1)
      await loadDashboardData()
    } catch (e) {
      console.error('Wissel opslaan mislukt:', e)
      setWisselFout(e?.message || 'Opslaan mislukt')
    } finally {
      setWisselBezig(false)
    }
  }

  const handleDayChange = (newDay) => {
    setSelectedDay(newDay)
  }

  const handleWizardComplete = async () => {
    setShowWizard(false)
    await loadDashboardData()
  }

  // Skelet in de vorm van de pagina (kop met foto, macro's, maaltijden)
  // in plaats van één spinner: je ziet de pagina al staan terwijl de
  // maaltijden binnenkomen.
  if (loading) return <MaaltijdSkelet isMobile={isMobile} />
  
  // (lege staat 'Geen actief meal plan' verwijderd: de pagina draait zonder
  // plan in de vrije stand, zie mealMode.)


  return (
    <div style={{
      // Vast scherm in plaats van een lange pagina: de kop (foto, dag, ringen)
      // blijft staan en alleen de maaltijden en supplementen scrollen —
      // hetzelfde als het oefeningen-scherm. Onder de zwevende onderbalk
      // (z-index 101) en onder de log-knop (90), zodat die bereikbaar blijven.
      position: 'fixed', inset: 0, height: '100dvh', zIndex: 1,
      background: '#0a0a0a',
      display: 'flex', flexDirection: 'column',
      overflowX: 'hidden',
      animation: 'fadeIn 0.5s ease'
    }}>

      {/* ════ ZWARTE BALK BOVEN DE FOTO ════
          Twee knoppen zonder kader, elk over de volle hoogte van de regel,
          gescheiden door een dun lijntje aan weerszijden van het midden.
          Eerder lagen het als pillen op de foto rechtsboven, onder elkaar —
          dat maakte de kop druk en de tweede knop viel half weg in het beeld. */}
      <div style={{
        flexShrink: 0,
        display: 'flex', alignItems: 'stretch',
        height: isMobile ? 34 : 40,
        paddingTop: isMobile ? 'env(safe-area-inset-top, 0px)' : 0,
        boxSizing: 'content-box',
        background: '#0a0a0a',
      }}>
        {(() => {
          const knop = (aan) => ({
            display: 'inline-flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
            padding: isMobile ? '0 0.9rem' : '0 1.2rem',
            background: 'transparent', border: 'none',
            // Alleen het icoon: geen tekst, geen lijntjes ertussen.
            minWidth: isMobile ? 42 : 48,
            color: aan ? '#fff' : 'rgba(255,255,255,0.55)',
            fontSize: isMobile ? '0.7rem' : '0.76rem', fontWeight: 900, lineHeight: 1,
            letterSpacing: '-0.01em',
            fontFamily: 'inherit', cursor: 'pointer', whiteSpace: 'nowrap',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          })
          return (
            <>
              <button onClick={() => setShopOpen(true)} title="Boodschappenlijst" aria-label="Boodschappenlijst" style={knop(true)}>
                <ShoppingCart size={17} strokeWidth={2.6} />
              </button>
              {/* Midden: de challenge-stand, als je meedoet. */}
              <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'stretch' }}>
                <ChallengeProgressTab db={db} client={client} isMobile={isMobile} inline />
              </div>
              {/* Het inzicht van de dag. Zat eerst achter een tik op de datum. */}
              <button
                onClick={() => setModals(prev => ({ ...prev, summary: true }))}
                title="Inzicht van deze dag"
                aria-label="Inzicht van deze dag"
                style={knop(true)}
              >
                <BarChart3 size={17} strokeWidth={2.6} />
              </button>
              <button
                onClick={toggleMealPlanVisible}
                disabled={savingVisibility}
                role="switch"
                aria-checked={mealPlanVisible}
                title={mealPlanVisible ? 'Maaltijdplan verbergen' : 'Maaltijdplan tonen'}
                aria-label={mealPlanVisible ? 'Maaltijdplan verbergen' : 'Maaltijdplan tonen'}
                style={{ ...knop(mealPlanVisible), opacity: savingVisibility ? 0.6 : 1 }}
              >
                {mealPlanVisible
                  ? <Eye size={17} strokeWidth={2.6} />
                  : <EyeOff size={17} strokeWidth={2.6} />}
              </button>
            </>
          )
        })()}
      </div>

      {/* ════ KOP MET FOTO — zelfde vorm als de workout-pagina ════
          De dag met de pijlen ligt op de foto, in plaats van een losse titel
          erboven en een balk eronder. Lager dan voorheen, want de knoppen
          staan nu in de balk erboven. */}
      <div style={{ position: 'relative', width: '100%', height: isMobile ? 100 : 150, flexShrink: 0 }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url(${MEAL_BANNER_URL})`,
          backgroundSize: 'cover', backgroundPosition: 'center',
        }} />
        {/* Zwart begint hoger dan op de workout-pagina: hier ligt niet alleen
            een titel op de foto maar een hele regel met pijlen en datum. */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          // Donkerder dan eerst, zodat de dagregel rustig op de foto ligt.
          background: 'linear-gradient(180deg, rgba(10,10,10,0.7) 0%, rgba(10,10,10,0.45) 25%, rgba(10,10,10,0.7) 50%, rgba(10,10,10,0.92) 75%, #0a0a0a 100%)',
        }} />

        <div style={{
          // Iets hoger in de foto dan eerst.
          position: 'absolute', left: 0, right: 0, bottom: isMobile ? 22 : 30,
        }}>
          <MealDayNavHeader
            selectedDay={selectedDay}
            onDayChange={handleDayChange}
            onOpenSummary={() => setModals(prev => ({ ...prev, summary: true }))}
            isMobile={isMobile}
            opFoto
            weekOffset={weekOffset}
            onWeekOffsetChange={setWeekOffset}
          />
        </div>
      </div>

      {/* ════ NEW MACRO HERO — selected-day aware ════
          flexShrink: 0 — in de flex-kolom van het vaste scherm zou dit blok
          anders indrukken zodra de lijst eronder om ruimte vraagt, en dan
          krimpen de ringen mee. */}
      <div style={{ flexShrink: 0 }}>
      {(() => {
        const currentDayIdx = dayKeyToIndex(selectedDay)
        const selectedDate = indexToDate(currentDayIdx, weekOffset)
        const selectedIsToday = weekOffset === 0 && currentDayIdx === getTodayIndex()
        return (
          <MacroHero
            consumed={dashboardData?.dailyTotals?.consumed}
            targets={dashboardData?.dailyTotals?.targets}
            db={db}
            clientId={client?.id}
            selectedDate={selectedDate}
            selectedIsToday={selectedIsToday}
            isMobile={isMobile}
            variant="boxes"
            zonderKader
            refreshKey={pastDayRefreshKey}
          />
        )
      })()}
      </div>

      {/* Belangrijke video van de coach, onder de macro's. Dit scherm staat
          vast (position: fixed, eigen scrollgebied), dus een blok dat
          ClientDashboard erboven zet valt erachter — hij hoort hier. Zelfde
          formaat als op de workout-pagina; één stijl op alle pagina's. */}
      <div style={{ flexShrink: 0 }}>
        <BelangrijkeVideo client={client} pagina="meal" isMobile={isMobile} />
      </div>

      {/* Alles hieronder scrolt; de kop erboven blijft staan. */}
      <div style={{
        flex: 1, minHeight: 0,
        overflowY: 'auto', WebkitOverflowScrolling: 'touch',
        // Ruimte voor de zwevende onderbalk en de log-knop.
        paddingBottom: 180,
      }}>

      {/* Challenge Sidebar - Floating Widget */}
      <MealChallengeSidebar client={client} db={db} />

      {/* "Klaar voor vandaag" — als alle geplande maaltijden gelogd zijn.
          Toont een rustig groene (of amber bij over-budget) banner zodat
          de dag een afgerond gevoel krijgt. Verschijnt alleen op de dag
          van vandaag, niet bij andere dagen. */}
      {(() => {
        const todayIdx = getTodayIndex()
        const selectedIdx = dayKeyToIndex(selectedDay)
        // "Klaar voor vandaag" hoort alleen bij vandaag, dus ook alleen in
        // deze week.
        if (weekOffset !== 0 || selectedIdx !== todayIdx) return null
        const plan = dashboardData.todayMeals || []
        if (plan.length === 0) return null
        const allDone = plan.every(m => m.isConsumed)
        if (!allDone) return null
        const t = dashboardData?.dailyTotals?.targets || {}
        const c = dashboardData?.dailyTotals?.consumed || {}
        const remaining = (t.calories || 0) - (c.calories || 0)
        return <DonePanel kcalRemaining={remaining} isMobile={isMobile} />
      })()}

      {/* ════ TIMELINE (overhaul phase 5: direct AIDaySchedule, mode-aware) ════ */}
      <AIDaySchedule
        workoutSchedule={trainingsSchema}
        alleenKijken={alleenKijken}
        mode={mealMode || 'plan'}
        hideTotalsBar
        activePlan={dashboardData.activePlan}
        todayMeals={dashboardData.todayMeals || []}
        todayProgress={dashboardData.todayProgress}
        selectedDay={selectedDay}
        onDayChange={handleDayChange}
        onCheckMeal={handleCheckMeal}
        onUncheckMeal={handleUncheckMeal}
        onOpenInfo={(meal) => setModals(prev => ({ ...prev, info: meal }))}
        onOpenAlternatives={(meal) => setModals(prev => ({ ...prev, alternatives: meal }))}
        onVerwijderMeal={(meal) => { setWisselFout(null); setVerwijderMeal(meal) }}
        db={db}
        dailyTotals={dashboardData.dailyTotals || {
          targets: {
            calories: client.target_calories || 0,
            protein: client.target_protein || 0,
            carbs: client.target_carbs || 0,
            fat: client.target_fat || 0,
          },
          consumed: { calories: 0, protein: 0, carbs: 0, fat: 0 },
        }}
        client={client}
        onMealLogged={handleMealLogged}
        targets={dashboardData.dailyTotals?.targets}
        foodLogTrigger={foodLogTrigger}
        foodLogTab={foodLogTab}
        weekOffset={weekOffset}
        dagRefreshKey={dagRefreshKey}
        onPastDayUpdate={() => setPastDayRefreshKey(k => k + 1)}
      />

      {/* Boodschappenlijst: schermvullend over de maaltijdpagina heen. */}
      {/* Via een portal: binnen de vaste maaltijdlaag (z-index 1) viel de
          onderbalk over de lijst heen, vooral zichtbaar in de PWA. */}
      {shopOpen && createPortal(
        <div style={{
          position: 'fixed', inset: 0, zIndex: 2147483000,
          background: '#0a0a0a', display: 'flex', flexDirection: 'column',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}>
          <div style={{
            flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10,
            padding: isMobile ? 'calc(0.9rem + env(safe-area-inset-top, 0px)) 1rem 0.8rem' : '1.1rem 1.5rem 0.9rem',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
          }}>
            <ShoppingCart size={19} color="#fff" strokeWidth={2.6} style={{ flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0, fontSize: isMobile ? '1.05rem' : '1.2rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>
              Boodschappen
            </div>
            <button
              onClick={() => setShopOpen(false)}
              aria-label="Sluiten"
              style={{
                width: 40, height: 40, flexShrink: 0, borderRadius: 12,
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              }}
            >
              <X size={19} strokeWidth={2.8} />
            </button>
          </div>
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <ShoppingHub client={client} db={db} />
          </div>
        </div>,
        document.body
      )}

      {/* De dagen die je coach klaarzette, achter een tab tegen de linkerrand.
          Staat buiten de dag-tijdlijn: het gaat over je week, niet over deze
          ene maaltijd. */}
      <DagTemplatePaneel
        db={db}
        client={client}
        activePlan={dashboardData.activePlan}
        isMobile={isMobile}
        dagIndex={dayKeyToIndex(selectedDay)}
        weekOffset={weekOffset}
        open={dagenOpen}
        onOpenChange={setDagenOpen}
        onToegepast={() => { setDagRefreshKey(k => k + 1); loadDashboardData() }}
      />

      </div>

      {/* Eén ronde witte log-knop — vervangt alle inline log-knoppen. Niet
          voor een meekijkende coach: die logt niet namens de klant. */}
      {!alleenKijken && <MealLogFAB
        onClick={() => { setFoodLogTab('search'); setFoodLogTrigger(n => n + 1) }}
        isMobile={isMobile}
      />}

      {/* Week Planner */}
      {showWeekPlanner && (
        <AIWeekPlanner
          activePlan={dashboardData.activePlan}
          client={client}
          db={db}
          onWeekUpdated={loadDashboardData}
          dailyTotals={dashboardData.dailyTotals}
        />
      )}
      
      {/* Video Widget — gemigreerd naar centrale WidgetSidebar in ClientDashboard.
          Hier weggehaald om dubbele floating-knop te voorkomen. */}

      {/* MODALS */}
      {modals.alternatives && (
        <AIAlternativesModal
          isOpen={!!modals.alternatives}
          onClose={() => { if (wisselBezig) return; setModals(prev => ({ ...prev, alternatives: null })); setWisselKeuze(null) }}
          currentMeal={modals.alternatives}
          onSelectMeal={(newMealId) => kiesWissel(modals.alternatives, newMealId, { inline: true })}
          waarInhoud={wisselKeuze?.inline ? (
            <DagenKiezer
              inline
              vraag="Waar wil je wisselen?"
              knopTekst="Wisselen"
              datum={indexToDate(dayKeyToIndex(selectedDay), weekOffset)}
              dagKey={DAYS_OF_WEEK[dayKeyToIndex(selectedDay)]?.key}
              slot={wisselKeuze.meal.slot}
              dagenMetMaaltijd={dagenMetMaaltijd(wisselKeuze.meal)}
              trainingsdagen={trainingsdagenVoor(wisselKeuze.meal)}
              vastAltijd
              bezig={wisselBezig}
              fout={wisselFout}
              isMobile={isMobile}
              onKies={voerWisselUit}
              onTerug={() => !wisselBezig && setWisselKeuze(null)}
              terugTekst="← Andere maaltijd"
            />
          ) : null}
          onMaaltijdAanmaken={() => {
            setModals(prev => ({ ...prev, alternatives: null }))
            setFoodLogTab('meals')
            setFoodLogTrigger(v => v + 1)
          }}
          db={db}
          service={service}
          client={client}
        />
      )}
      
      {wisselKeuze && !wisselKeuze.inline && createPortal(
        // Zelfde pop-up als verwijderen: oud -> nieuw, dan waar.
        <div style={{ position: 'fixed', inset: 0, zIndex: 11000 }}>
          <DagenKiezer
            volScherm
            foto={resolveFoodImage(wisselKeuze.meal, { size: 300 })}
            fotoNaar={resolveFoodImage(wisselKeuze.nieuw, { size: 300 })}
            vraag="Wil je deze maaltijd wisselen?"
            titel={`${wisselKeuze.meal.name || wisselKeuze.meal.meal_name} → ${wisselKeuze.nieuw.name || wisselKeuze.nieuw.meal_name}`}
            subtitel={`${Math.round(wisselKeuze.meal.calories || 0)} → ${Math.round(wisselKeuze.nieuw.calories || 0)} kcal`}
            knopTekst="Wisselen"
            datum={indexToDate(dayKeyToIndex(selectedDay), weekOffset)}
            dagKey={DAYS_OF_WEEK[dayKeyToIndex(selectedDay)]?.key}
            slot={wisselKeuze.meal.slot}
            dagenMetMaaltijd={dagenMetMaaltijd(wisselKeuze.meal)}
            trainingsdagen={trainingsdagenVoor(wisselKeuze.meal)}
            vastAltijd
            bezig={wisselBezig}
            fout={wisselFout}
            isMobile={isMobile}
            onKies={voerWisselUit}
            onClose={() => !wisselBezig && setWisselKeuze(null)}
          />
        </div>,
        document.body
      )}

      {verwijderMeal && createPortal(
        // Volledig scherm zoals het logscherm: foto, grote vraag, dan waar.
        <div style={{ position: 'fixed', inset: 0, zIndex: 11000 }}>
          <DagenKiezer
            volScherm
            foto={resolveFoodImage(verwijderMeal, { size: 300 })}
            titel={verwijderMeal.name || verwijderMeal.meal_name}
            subtitel={`${Math.round(verwijderMeal.calories || 0)} kcal`}
            vraag="Waar wil je deze maaltijd verwijderen?"
            knopTekst="Verwijderen"
            gevaar
            datum={indexToDate(dayKeyToIndex(selectedDay), weekOffset)}
            dagKey={DAYS_OF_WEEK[dayKeyToIndex(selectedDay)]?.key}
            slot={verwijderMeal.slot}
            dagenMetMaaltijd={dagenMetMaaltijd(verwijderMeal)}
            trainingsdagen={trainingsdagenVoor(verwijderMeal)}
            bezig={wisselBezig}
            fout={wisselFout}
            isMobile={isMobile}
            onKies={voerVerwijderUit}
            onClose={() => !wisselBezig && setVerwijderMeal(null)}
          />
        </div>,
        document.body
      )}

      {naWisselSchild && (
        <div
          onClick={(e) => { e.preventDefault(); e.stopPropagation() }}
          style={{ position: 'fixed', inset: 0, zIndex: 99998, background: 'transparent' }}
        />
      )}

      {modals.info && (
        <AIMealInfoModal
          key={modals.info?.id || modals.info?.meal_id || Date.now()}
          isOpen={!!modals.info}
          onClose={() => setModals(prev => ({ ...prev, info: null }))}
          meal={modals.info}
          db={db}
          service={service}
          client={client}
          planId={dashboardData.activePlan?.id}
          dayName={DAYS_OF_WEEK[dayKeyToIndex(selectedDay)]?.key}
          // Ook de week telt: dezelfde weekdag volgende week is niet vandaag.
          isToday={weekOffset === 0 && dayKeyToIndex(selectedDay) === getTodayIndex()}
          datum={indexToDate(dayKeyToIndex(selectedDay), weekOffset)}
          // Ook de ringen van een andere dag verversen: een aanpassing achteraf
          // werkt de log van die dag bij, en MacroHero hield de oude som vast.
          onSaved={() => { setModals(prev => ({ ...prev, info: null })); setPastDayRefreshKey(k => k + 1); loadDashboardData() }}
        />
      )}
      
      {modals.favorites && (
        <AIFavoritesModal
          isOpen={modals.favorites}
          onClose={() => setModals(prev => ({ ...prev, favorites: false }))}
          onSelectMeal={(mealId) => {
            if (dashboardData.nextMeal) {
              kiesWissel(dashboardData.nextMeal, mealId)
            }
          }}
          currentMeal={dashboardData.nextMeal}
          db={db}
          service={service}
          client={client}
        />
      )}
      
      {modals.history && (
        <AIMealHistoryModal
          isOpen={modals.history}
          onClose={() => setModals(prev => ({ ...prev, history: false }))}
          db={db}
          clientId={client.id}
          service={service}
        />
      )}

      {/* Geconsolideerde dag-/agenda-modal die opent vanuit MealDayNavHeader. */}
      {modals.summary && (
        <MealDaySummaryModal
          isOpen={modals.summary}
          onClose={() => setModals(prev => ({ ...prev, summary: false }))}
          db={db}
          clientId={client.id}
          selectedDay={selectedDay}
          onDayChange={handleDayChange}
          onOpenFullHistory={() => setModals(prev => ({ ...prev, summary: false, history: true }))}
          targets={dashboardData?.dailyTotals?.targets || {
            calories: client.target_calories || 0,
            protein:  client.target_protein  || 0,
            carbs:    client.target_carbs    || 0,
            fat:      client.target_fat      || 0,
          }}
          isMobile={isMobile}
        />
      )}

      {/* ✅ NIEUW: Supplement Panel */}
      {modals.supplements && (
        <SupplementPlanPanel
          clientId={client.id}
          clientWeight={client.weight}
          trainingFreq={client.training_frequency}
          isOpen={modals.supplements}
          onClose={() => setModals(prev => ({ ...prev, supplements: false }))}
        />
      )}

      {/* ✅ NIEUW: Weekly Nutrition Overview */}
      {modals.weekOverview && (
        <WeeklyNutritionOverview
          isOpen={modals.weekOverview}
          onClose={() => setModals(prev => ({ ...prev, weekOverview: false }))}
          client={client}
          db={db}
          targets={dashboardData.dailyTotals?.targets || {
            calories: client.target_calories || 0,
            protein: client.target_protein || 0,
            carbs: client.target_carbs || 0,
            fat: client.target_fat || 0
          }}
        />
      )}
      
      {/* ✅ OVERHAUL: Meer-sheet (bottom sheet) */}
      <MoreActionsSheet
        isOpen={modals.more}
        onClose={() => setModals(prev => ({ ...prev, more: false }))}
        isPlanMode={(mealMode || 'plan') === 'plan'}
        onOpenSupplements={() => setModals(prev => ({ ...prev, more: false, supplements: true }))}
        onOpenDocuments={() => setModals(prev => ({ ...prev, more: false, documents: true }))}
        onOpenPlanEdit={() => {
          setModals(prev => ({ ...prev, more: false }))
          setShowWeekPlanner(true)
        }}
        onOpenCoachWizard={() => {
          setModals(prev => ({ ...prev, more: false }))
          setShowWizard(true)
        }}
        isMobile={isMobile}
      />

      {/* ✅ OVERHAUL: Documents fullscreen modal */}
      {modals.documents && (
        <div
          onClick={() => setModals(prev => ({ ...prev, documents: false }))}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.92)',
            backdropFilter: 'blur(8px)',
            zIndex: 2050,
            display: 'flex',
            flexDirection: 'column',
            paddingTop: 'env(safe-area-inset-top, 0)',
            paddingBottom: 'env(safe-area-inset-bottom, 0)',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              flex: 1,
              maxWidth: '900px',
              width: '100%',
              margin: '0 auto',
              background: '#0a0a0a',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '0.75rem 1rem',
              borderBottom: '1px solid rgba(255, 215, 0, 0.18)',
            }}>
              <span style={{
                fontSize: '0.75rem', fontWeight: 800, color: '#FFD700',
                letterSpacing: '0.06em', textTransform: 'uppercase',
              }}>
                Documenten
              </span>
              <button
                onClick={() => setModals(prev => ({ ...prev, documents: false }))}
                aria-label="Sluiten"
                style={{
                  width: '30px', height: '30px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(255, 215, 0, 0.06)',
                  border: '1px solid rgba(255, 215, 0, 0.18)',
                  borderRadius: '8px',
                  color: '#FFD700',
                  cursor: 'pointer',
                  fontSize: '1.1rem',
                  fontWeight: 700,
                }}
              >
                ✕
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '0.75rem' : '1.5rem' }}>
              <ClientDocumentsSection
                db={db} clientId={client.id} coachId={null}
                isMobile={isMobile} isClientView={true}
              />
            </div>
          </div>
        </div>
      )}

      {/* Coach Strategy Wizard */}
      {showWizard && (
        <MealSetupWizard
          isOpen={showWizard}
          onClose={() => setShowWizard(false)}
          onComplete={handleWizardComplete}
          client={client}
          db={db}
          isMobile={isMobile}
        />
      )}
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}
