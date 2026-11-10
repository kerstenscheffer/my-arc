// src/modules/ai-meal-generator/tabs/plan-analyzer/weekCijfers.js
//
// Cijfers en signalen voor de hele week (10 nov 2026), voor de stats-tabel
// en de weekkolommen in de Plan Analyzer. Puur rekenwerk, geen React.
//
// Grenzen gelijk aan de dag-ringen en de dagstrip: onder 85% van het doel is
// te weinig (rood), boven 115% te veel (oranje).

import { PRE_WORKOUT_SLOT } from '../../../meal-plan/utils/preWorkoutMeal'

export const ONDER = 85
export const BOVEN = 115

export const MACROS = [
  { key: 'kcal', doel: 'calories', label: 'Kcal', eenheid: '' },
  { key: 'protein', doel: 'protein', label: 'Eiwit', eenheid: 'g' },
  { key: 'carbs', doel: 'carbs', label: 'Koolh', eenheid: 'g' },
  { key: 'fat', doel: 'fat', label: 'Vet', eenheid: 'g' },
  { key: 'fiber', doel: 'fiber', label: 'Vezels', eenheid: 'g' },
]

const getal = (v) => Number(v) || 0
const tijdVan = (meal, slot, standaard) => {
  const t = meal?.timing
  if (typeof t === 'string' && /^\d{1,2}:\d{2}/.test(t)) return t.slice(0, 5).padStart(5, '0')
  return standaard[slot] || '12:00'
}

export const pctKleur = (pct) => {
  if (pct == null) return 'rgba(255,255,255,0.35)'
  if (pct < ONDER) return '#ef4444'
  if (pct > BOVEN) return '#f59e0b'
  return '#22c55e'
}

// Per dag: totalen (inclusief de losse pre-workout op trainingsdagen, net als
// dagTotalen in de Analyzer) en de maaltijden op tijd gesorteerd.
// isTraining(i) zegt of dag i een trainingsdag is.
export function dagCijfers(weekData, { preWorkoutMeal = null, isTraining = () => false, standaardTijden = {} } = {}) {
  return (weekData || []).map((dag, i) => {
    const training = !!isTraining(i)
    const maaltijden = Object.entries(dag?.meals || {})
      .filter(([, m]) => m && typeof m === 'object')
      .map(([slot, meal]) => ({ slot, meal, tijd: tijdVan(meal, slot, standaardTijden), los: false }))
    if (preWorkoutMeal && training && !dag?.meals?.[PRE_WORKOUT_SLOT]) {
      maaltijden.push({ slot: PRE_WORKOUT_SLOT, meal: preWorkoutMeal, tijd: tijdVan(preWorkoutMeal, PRE_WORKOUT_SLOT, standaardTijden), los: true })
    }
    maaltijden.sort((a, b) => a.tijd.localeCompare(b.tijd))
    const t = { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
    maaltijden.forEach(({ meal }) => {
      t.kcal += getal(meal.calories)
      t.protein += getal(meal.protein)
      t.carbs += getal(meal.carbs)
      t.fat += getal(meal.fat)
      t.fiber += getal(meal.fiber)
    })
    return { index: i, training, maaltijden, ...t }
  })
}

export const pctVan = (waarde, doel) => (getal(doel) > 0 ? (getal(waarde) / getal(doel)) * 100 : null)

// Gemiddelde over de dagen met eten (een lege dag trekt het gemiddelde
// anders omlaag terwijl er gewoon nog niets gepland is).
export function weekGemiddelde(dagen) {
  const met = dagen.filter(d => d.maaltijden.length > 0)
  const uit = { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, dagen: met.length }
  if (!met.length) return uit
  MACROS.forEach(({ key }) => { uit[key] = met.reduce((s, d) => s + d[key], 0) / met.length })
  return uit
}

const DAG_KORT = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo']
const dagLijst = (idx) => idx.map(i => DAG_KORT[i]).join(', ')

// Signalen voor de coach: wat valt op in deze week? Elk signaal heeft een
// ernst (rood/oranje/grijs), een tekst en de dagen waar het speelt.
export function weekSignalen(dagen, targets = {}) {
  const uit = []
  const metEten = dagen.filter(d => d.maaltijden.length > 0)

  // 1. Macro's per dag buiten de band.
  MACROS.forEach(({ key, doel, label }) => {
    const d = getal(targets?.[doel])
    if (!d) return
    const onder = [], boven = []
    metEten.forEach(dag => {
      const p = pctVan(dag[key], d)
      if (p < ONDER) onder.push(dag.index)
      else if (p > BOVEN) boven.push(dag.index)
    })
    if (onder.length) uit.push({ ernst: key === 'protein' || key === 'kcal' ? 'rood' : 'oranje', tekst: `${label} onder doel op ${dagLijst(onder)}`, dagen: onder })
    if (boven.length) uit.push({ ernst: 'oranje', tekst: `${label} boven doel op ${dagLijst(boven)}`, dagen: boven })
  })

  // 2. Lege dagen.
  const leeg = dagen.filter(d => d.maaltijden.length === 0).map(d => d.index)
  if (leeg.length && leeg.length < 7) uit.push({ ernst: 'rood', tekst: `Geen maaltijden op ${dagLijst(leeg)}`, dagen: leeg })

  // 3. Koolhydraten: op een trainingsdag hoort er meer te zijn dan op een rustdag.
  const tr = metEten.filter(d => d.training), rust = metEten.filter(d => !d.training)
  if (tr.length && rust.length) {
    const gemT = tr.reduce((s, d) => s + d.carbs, 0) / tr.length
    const gemR = rust.reduce((s, d) => s + d.carbs, 0) / rust.length
    if (gemR > gemT + 10) uit.push({ ernst: 'oranje', tekst: `Rustdagen hebben meer koolhydraten (${Math.round(gemR)} g) dan trainingsdagen (${Math.round(gemT)} g)`, dagen: rust.map(d => d.index) })
  }

  // 4. Variatie: dezelfde maaltijd heel vaak in de week (de vaste
  //    ontbijt-kwark is prima, dus pas vanaf 6×, en alleen grotere maaltijden).
  const telling = new Map()
  metEten.forEach(dag => dag.maaltijden.forEach(({ meal, los }) => {
    if (los || getal(meal.calories) < 300) return
    const sleutel = meal.meal_id || meal.id || meal.name
    if (!sleutel) return
    const t = telling.get(sleutel) || { naam: meal.name || 'Maaltijd', dagen: new Set() }
    t.dagen.add(dag.index)
    telling.set(sleutel, t)
  }))
  telling.forEach(t => {
    if (t.dagen.size >= 6) uit.push({ ernst: 'grijs', tekst: `${t.naam} staat ${t.dagen.size}× in de week`, dagen: [...t.dagen] })
  })

  // 5. Eén maaltijd die meer dan de helft van de dag-kcal is.
  const zwaar = []
  metEten.forEach(dag => dag.maaltijden.forEach(({ meal }) => {
    if (dag.kcal > 0 && getal(meal.calories) > dag.kcal * 0.5 && dag.maaltijden.length >= 3) zwaar.push({ dag: dag.index, naam: meal.name })
  }))
  if (zwaar.length) {
    const namen = [...new Set(zwaar.map(z => z.naam))].slice(0, 2).join(', ')
    uit.push({ ernst: 'grijs', tekst: `Eén maaltijd is meer dan de helft van de dag (${namen})`, dagen: [...new Set(zwaar.map(z => z.dag))] })
  }

  const rang = { rood: 0, oranje: 1, grijs: 2 }
  return uit.sort((a, b) => rang[a.ernst] - rang[b.ernst])
}
