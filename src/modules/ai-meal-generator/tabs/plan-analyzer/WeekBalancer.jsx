// src/modules/ai-meal-generator/tabs/plan-analyzer/WeekBalancer.jsx
// Intelligente week balancer met per-macro sliders + concessie-flow
// v2.0

import React, { useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useModalHost } from '../../../../coach/ModalHost'
import { X, Zap, Check, AlertTriangle, ChevronRight, TrendingDown, TrendingUp, Minus } from 'lucide-react'

const DAYS_NL = ['Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag', 'Zondag']
const DAY_IDS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

// Kleur op basis van percentage van target
const pctColor = (pct) => {
  if (pct >= 92 && pct <= 108) return '#10b981'
  if (pct >= 80 && pct <= 120) return '#f59e0b'
  return '#ef4444'
}

const pctLabel = (pct) => {
  if (pct >= 92 && pct <= 108) return '✓'
  if (pct > 108) return `+${pct - 100}%`
  return `-${100 - pct}%`
}

// Analyseer per dag welke macro's het verst van target zitten
function analyzeDayIssues(day, targets) {
  const meals = Object.entries(day.meals || {}).filter(([, m]) => m)
  if (meals.length === 0) return null

  const getMealName = (meal) => meal.name || meal.meal_name || meal.title || 'Maaltijd'

  const totals = {
    kcal:    meals.reduce((s, [, m]) => s + (m.calories || 0), 0),
    protein: meals.reduce((s, [, m]) => s + (m.protein  || 0), 0),
    carbs:   meals.reduce((s, [, m]) => s + (m.carbs    || 0), 0),
    fat:     meals.reduce((s, [, m]) => s + (m.fat      || 0), 0),
  }

  const issues = []
  const calPct  = targets.calories ? Math.round((totals.kcal    / targets.calories) * 100) : 100
  const protPct = targets.protein  ? Math.round((totals.protein / targets.protein)  * 100) : 100
  const carbPct = targets.carbs    ? Math.round((totals.carbs   / targets.carbs)    * 100) : 100
  const fatPct  = targets.fat      ? Math.round((totals.fat     / targets.fat)      * 100) : 100

  if (calPct  < 88)  issues.push({ macro: 'kcal',  type: 'low',  pct: calPct  })
  if (calPct  > 112) issues.push({ macro: 'kcal',  type: 'high', pct: calPct  })
  if (protPct < 88)  issues.push({ macro: 'eiwit', type: 'low',  pct: protPct })
  if (protPct > 112) issues.push({ macro: 'eiwit', type: 'high', pct: protPct })
  if (fatPct  < 80)  issues.push({ macro: 'vet',   type: 'low',  pct: fatPct  })
  if (fatPct  > 120) issues.push({ macro: 'vet',   type: 'high', pct: fatPct  })

  const concessies = []

  // ── SCENARIO A: Te veel kcal + te weinig eiwit ──
  // Slim: zoek maaltijd met slechtste eiwit/kcal ratio en stel swap voor
  if (calPct > 108 && protPct < 95) {
    // Sorteer op kcal/eiwit ratio — hoogste ratio = meeste kcal voor minste eiwit = slechtste keuze
    const sortedByRatio = [...meals]
      .map(([slot, m]) => ({ slot, m, ratio: (m.calories || 0) / Math.max(1, (m.protein || 0)) }))
      .sort((a, b) => b.ratio - a.ratio)
    const worst = sortedByRatio[0]
    const calOvershoot = totals.kcal - targets.calories
    const protShortfall = targets.protein - totals.protein
    concessies.push({
      type: 'swap_suggestion',
      slot: worst.slot,
      mealName: getMealName(worst.m),
      description: `"${getMealName(worst.m)}" heeft veel calorieën (${Math.round(worst.m.calories)} kcal) maar weinig eiwit (${Math.round(worst.m.protein)}g). Swap naar een eiwitrijkere variant — bijv. kipfilet, kwark of magere kaas.`,
      macro: 'eiwit',
      impact: `−${Math.round(calOvershoot)} kcal teveel · +${Math.round(protShortfall)}g eiwit nodig`,
      actionable: false
    })
  }

  // ── Te veel eiwit (>108%) ──
  if (protPct > 108 && !(calPct > 108 && protPct < 95)) {
    const sortedByProt = [...meals].sort((a, b) => (b[1].protein || 0) - (a[1].protein || 0))
    const [slot, meal] = sortedByProt[0]
    const factor = Math.max(0.4, targets.protein / totals.protein)
    concessies.push({
      type: 'scale_meal', slot, mealName: getMealName(meal),
      description: `Verklein "${getMealName(meal)}" (${Math.round(meal.protein)}g E) naar ${Math.round(factor * 100)}% portie`,
      factor, macro: 'eiwit',
      impact: `−${Math.round((1 - factor) * (meal.original_protein || meal.protein))}g eiwit, −${Math.round((1 - factor) * (meal.original_calories || meal.calories))} kcal`
    })
    if (sortedByProt.length > 1) {
      const [slot2, meal2] = sortedByProt[1]
      if ((meal2.protein || 0) > 20) {
        concessies.push({
          type: 'scale_meal', slot: slot2, mealName: getMealName(meal2),
          description: `Of verklein "${getMealName(meal2)}" (${Math.round(meal2.protein)}g E) naar ${Math.round(factor * 100)}% portie`,
          factor, macro: 'eiwit',
          impact: `−${Math.round((1 - factor) * (meal2.original_protein || meal2.protein))}g eiwit, −${Math.round((1 - factor) * (meal2.original_calories || meal2.calories))} kcal`
        })
      }
    }
  }

  // ── Te weinig eiwit (<92%), kcal op target ──
  if (protPct < 92 && calPct <= 108) {
    const sortedByProt = [...meals].sort((a, b) => (b[1].protein || 0) - (a[1].protein || 0))
    const [slot, meal] = sortedByProt[0]
    const factor = Math.min(1.8, targets.protein / totals.protein)
    concessies.push({
      type: 'scale_meal', slot, mealName: getMealName(meal),
      description: `Vergroot "${getMealName(meal)}" naar ${Math.round(factor * 100)}% portie voor meer eiwit`,
      factor, macro: 'eiwit',
      impact: `+${Math.round((factor - 1) * (meal.original_protein || meal.protein))}g eiwit, +${Math.round((factor - 1) * (meal.original_calories || meal.calories))} kcal`
    })
  }

  // ── Te veel vet (>112%) ──
  if (fatPct > 112) {
    const sortedByFat = [...meals].sort((a, b) => (b[1].fat || 0) - (a[1].fat || 0))
    const [slot, meal] = sortedByFat[0]
    const factor = Math.max(0.4, targets.fat / totals.fat)
    concessies.push({
      type: 'scale_meal', slot, mealName: getMealName(meal),
      description: `"${getMealName(meal)}" heeft ${Math.round(meal.fat)}g vet. Verklein naar ${Math.round(factor * 100)}% portie`,
      factor, macro: 'vet',
      impact: `−${Math.round((1 - factor) * (meal.original_fat || meal.fat))}g vet, −${Math.round((1 - factor) * (meal.original_calories || meal.calories))} kcal`
    })
  }

  // ── Te weinig vet (<88%) ──
  if (fatPct < 88) {
    const sortedByFat = [...meals].sort((a, b) => (b[1].fat || 0) - (a[1].fat || 0))
    const [slot, meal] = sortedByFat[0]
    const factor = Math.min(2.0, targets.fat / totals.fat)
    concessies.push({
      type: 'scale_meal', slot, mealName: getMealName(meal),
      description: `Vergroot "${getMealName(meal)}" naar ${Math.round(factor * 100)}% portie voor meer vet`,
      factor, macro: 'vet',
      impact: `+${Math.round((factor - 1) * (meal.original_fat || meal.fat))}g vet`
    })
  }

  // ── Te veel kcal (>108%), eiwit OK ──
  if (calPct > 108 && protPct >= 95) {
    const sortedByCal = [...meals].sort((a, b) => (b[1].calories || 0) - (a[1].calories || 0))
    const [slot, meal] = sortedByCal[0]
    const factor = Math.max(0.4, targets.calories / totals.kcal)
    concessies.push({
      type: 'scale_meal', slot, mealName: getMealName(meal),
      description: `Verklein "${getMealName(meal)}" (${Math.round(meal.calories)} kcal) naar ${Math.round(factor * 100)}% portie`,
      factor, macro: 'kcal',
      impact: `−${Math.round((1 - factor) * (meal.original_calories || meal.calories))} kcal`
    })
  }

  // ── Te weinig kcal (<92%) ──
  if (calPct < 92) {
    const sortedByCarbs = [...meals].sort((a, b) => (b[1].carbs || 0) - (a[1].carbs || 0))
    const [slot, meal] = sortedByCarbs[0]
    const factor = Math.min(2.0, targets.calories / totals.kcal)
    concessies.push({
      type: 'scale_meal', slot, mealName: getMealName(meal),
      description: `Vergroot "${getMealName(meal)}" naar ${Math.round(factor * 100)}% portie voor meer calorieën`,
      factor, macro: 'kcal',
      impact: `+${Math.round((factor - 1) * (meal.original_calories || meal.calories))} kcal`
    })
    concessies.push({
      type: 'add_calories', mealName: '',
      description: `Dag heeft ${Math.round(targets.calories - totals.kcal)} kcal tekort. Voeg rijst, pasta of een snack toe.`,
      macro: 'kcal',
      impact: `+${Math.round(targets.calories - totals.kcal)} kcal nodig`,
      actionable: false
    })
  }

  return { totals, issues, concessies, calPct, protPct, carbPct, fatPct }
}

export default function WeekBalancer({ weekData, targets, onApply, onClose, isMobile }) {
  const modalHost = useModalHost()
  const [mode, setMode] = useState('smart') // 'smart' | 'scale' | 'perday'
  const [applied, setApplied] = useState(false)
  const [selectedDay, setSelectedDay] = useState(null)
  const [appliedConcessies, setAppliedConcessies] = useState({}) // dayIndex -> Set of applied

  // Per-macro target overrides (coach kan aanpassen)
  const [targetOverride, setTargetOverride] = useState({
    calories: targets?.calories || 2500,
    protein:  targets?.protein  || 150,
    carbs:    targets?.carbs    || 300,
    fat:      targets?.fat      || 80,
  })

  const m = isMobile

  // Analyseer alle dagen
  const dayAnalyses = useMemo(() => {
    if (!weekData) return []
    return weekData.map((day, i) => {
      const analysis = analyzeDayIssues(day, targetOverride)
      return { dayIndex: i, day, analysis }
    })
  }, [weekData, targetOverride])

  const daysWithMeals = dayAnalyses.filter(d => d.analysis).length

  // Bereken week gemiddelden
  const weekAvg = useMemo(() => {
    const valid = dayAnalyses.filter(d => d.analysis)
    if (valid.length === 0) return null
    return {
      kcal: Math.round(valid.reduce((s, d) => s + d.analysis.totals.kcal, 0) / valid.length),
      protein: Math.round(valid.reduce((s, d) => s + d.analysis.totals.protein, 0) / valid.length),
      carbs: Math.round(valid.reduce((s, d) => s + d.analysis.totals.carbs, 0) / valid.length),
      fat: Math.round(valid.reduce((s, d) => s + d.analysis.totals.fat, 0) / valid.length),
    }
  }, [dayAnalyses])

  // Pas een concessie toe op een dag
  const applyConcessie = (dayIndex, concessie) => {
    const day = weekData[dayIndex]
    if (!day || concessie.type !== 'scale_meal') return

    const meal = day.meals[concessie.slot]
    if (!meal) return
    const getMealName = (m) => m.name || m.meal_name || m.title || 'Maaltijd'

    const factor = concessie.factor
    const scaledMeal = {
      ...meal,
      calories: Math.round((meal.original_calories || meal.calories) * factor),
      protein:  Math.round((meal.original_protein  || meal.protein)  * factor * 10) / 10,
      carbs:    Math.round((meal.original_carbs     || meal.carbs)    * factor * 10) / 10,
      fat:      Math.round((meal.original_fat       || meal.fat)      * factor * 10) / 10,
      scale_factor: factor,
    }

    if (meal.ingredients_list && !Array.isArray(meal.ingredients_list) && typeof meal.ingredients_list === 'object') {
      scaledMeal.ingredients_list = {}
      Object.entries(meal.ingredients_list).forEach(([name, amount]) => {
        scaledMeal.ingredients_list[name] = typeof amount === 'number' ? Math.round(amount * factor) : amount
      })
    }

    const updatedDay = {
      ...day,
      meals: { ...day.meals, [concessie.slot]: scaledMeal }
    }
    const vals = Object.values(updatedDay.meals).filter(Boolean)
    updatedDay.totals = {
      kcal:    vals.reduce((s, m) => s + (m.calories || 0), 0),
      protein: vals.reduce((s, m) => s + (m.protein  || 0), 0),
      carbs:   vals.reduce((s, m) => s + (m.carbs    || 0), 0),
      fat:     vals.reduce((s, m) => s + (m.fat      || 0), 0),
    }

    const updated = weekData.map((d, i) => i === dayIndex ? updatedDay : d)
    onApply(updated, false) // false = don't close

    setAppliedConcessies(prev => ({
      ...prev,
      [dayIndex]: new Set([...(prev[dayIndex] || []), concessie.description])
    }))
  }

  // Schaal alle dagen naar target (oude methode)
  const handleScaleAll = () => {
    const updatedWeekData = weekData.map((day, i) => {
      const analysis = dayAnalyses[i]?.analysis
      if (!analysis) return day

      const meals = Object.entries(day.meals || {}).filter(([, m]) => m)
      const baseCal = meals.reduce((s, [, m]) => s + (m.original_calories || m.calories || 0), 0)
      const baseProt = meals.reduce((s, [, m]) => s + (m.original_protein || m.protein || 0), 0)
      const baseFat = meals.reduce((s, [, m]) => s + (m.original_fat || m.fat || 0), 0)

      let scaleFactor = 1
      const rawCal = baseCal > 0 ? targetOverride.calories / baseCal : 1
      const rawProt = baseProt > 0 ? targetOverride.protein / baseProt : 1
      const rawFat = baseFat > 0 ? targetOverride.fat / baseFat : 1

      // Gewogen: kcal 50%, eiwit 30%, vet 20%
      scaleFactor = rawCal * 0.5 + rawProt * 0.3 + rawFat * 0.2
      scaleFactor = Math.max(0.3, Math.min(2.5, scaleFactor))

      const scaledMeals = {}
      meals.forEach(([slot, meal]) => {
        const bc = meal.original_calories || meal.calories || 0
        const bp = meal.original_protein  || meal.protein  || 0
        const bk = meal.original_carbs    || meal.carbs    || 0
        const bv = meal.original_fat      || meal.fat      || 0

        let newIngredients = meal.ingredients_list
        if (meal.ingredients_list && !Array.isArray(meal.ingredients_list) && typeof meal.ingredients_list === 'object') {
          newIngredients = {}
          Object.entries(meal.ingredients_list).forEach(([name, amount]) => {
            newIngredients[name] = typeof amount === 'number' ? Math.round(amount * scaleFactor) : amount
          })
        } else if (Array.isArray(meal.ingredients_list)) {
          newIngredients = meal.ingredients_list.map(ing =>
            typeof ing === 'object' && ing !== null && typeof ing.amount === 'number'
              ? { ...ing, amount: Math.round(ing.amount * scaleFactor * 10) / 10 }
              : ing
          )
        }

        scaledMeals[slot] = {
          ...meal,
          calories: Math.round(bc * scaleFactor),
          protein:  Math.round(bp * scaleFactor * 10) / 10,
          carbs:    Math.round(bk * scaleFactor * 10) / 10,
          fat:      Math.round(bv * scaleFactor * 10) / 10,
          scale_factor: scaleFactor,
          original_calories: bc, original_protein: bp,
          original_carbs: bk, original_fat: bv,
          ingredients_list: newIngredients
        }
      })

      const vals = Object.values(scaledMeals).filter(Boolean)
      return {
        ...day,
        meals: scaledMeals,
        totals: {
          kcal:    vals.reduce((s, m) => s + (m.calories || 0), 0),
          protein: vals.reduce((s, m) => s + (m.protein  || 0), 0),
          carbs:   vals.reduce((s, m) => s + (m.carbs    || 0), 0),
          fat:     vals.reduce((s, m) => s + (m.fat      || 0), 0),
        }
      }
    })

    onApply(updatedWeekData)
    setApplied(true)
    setTimeout(() => onClose(), 800)
  }

  const totalIssues = dayAnalyses.reduce((s, d) => s + (d.analysis?.issues.length || 0), 0)

  const modal = (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)',
        zIndex: 10000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center'
      }}
    >
      <div style={{
        background: '#0a0a0a', borderRadius: '16px 16px 0 0',
        width: '100%', maxWidth: '620px', maxHeight: '90vh',
        display: 'flex', flexDirection: 'column', overflow: 'hidden'
      }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: m ? '0.625rem 0.75rem' : '0.75rem 1rem',
          borderBottom: '1px solid rgba(255,255,255,0.06)'
        }}>
          <div>
            <div style={{ fontSize: m ? '0.85rem' : '0.95rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Zap size={16} color="#FFD700" /> Week Analyse & Balanceren
            </div>
            <div style={{ fontSize: m ? '0.5rem' : '0.55rem', color: 'rgba(255,255,255,0.3)' }}>
              {totalIssues > 0 ? `${totalIssues} aandachtspunten gevonden` : 'Week ziet er goed uit'}
            </div>
          </div>
          <button onClick={onClose} style={{
            width: '32px', height: '32px', borderRadius: '6px', background: 'transparent',
            border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.3)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent'
          }}><X size={16} /></button>
        </div>

        {/* Target overrides — coach kan aanpassen */}
        <div style={{ padding: m ? '0.5rem 0.75rem' : '0.625rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,215,0,0.02)' }}>
          <div style={{ fontSize: '0.42rem', fontWeight: 700, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>
            TARGETS (aanpasbaar)
          </div>
          <div style={{ display: 'flex', gap: '0.375rem' }}>
            {[
              { key: 'calories', label: 'KCAL', color: '#FFD700', step: 50 },
              { key: 'protein',  label: 'EIWIT', color: '#10b981', step: 5 },
              { key: 'carbs',    label: 'CARBS', color: '#3b82f6', step: 10 },
              { key: 'fat',      label: 'VET', color: '#f59e0b', step: 5 },
            ].map(({ key, label, color, step }) => (
              <div key={key} style={{ flex: 1, background: 'rgba(255,255,255,0.02)', border: `1px solid ${color}20`, borderRadius: '6px', padding: '0.35rem 0.4rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.38rem', fontWeight: 700, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.15rem' }}>{label}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.15rem', justifyContent: 'center' }}>
                  <button onClick={() => setTargetOverride(p => ({ ...p, [key]: Math.max(0, p[key] - step) }))} style={{ width: '16px', height: '16px', borderRadius: '3px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 800, fontFamily: 'inherit', touchAction: 'manipulation', flexShrink: 0 }}>−</button>
                  <span style={{ fontSize: m ? '0.65rem' : '0.7rem', fontWeight: 800, color, minWidth: '32px', textAlign: 'center' }}>{targetOverride[key]}</span>
                  <button onClick={() => setTargetOverride(p => ({ ...p, [key]: p[key] + step }))} style={{ width: '16px', height: '16px', borderRadius: '3px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 800, fontFamily: 'inherit', touchAction: 'manipulation', flexShrink: 0 }}>+</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Week gemiddelde */}
        {weekAvg && (
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            {[
              { label: 'GEM KCAL', val: weekAvg.kcal, target: targetOverride.calories, color: '#FFD700' },
              { label: 'GEM EIWIT', val: weekAvg.protein, target: targetOverride.protein, color: '#10b981' },
              { label: 'GEM CARBS', val: weekAvg.carbs, target: targetOverride.carbs, color: '#3b82f6' },
              { label: 'GEM VET', val: weekAvg.fat, target: targetOverride.fat, color: '#f59e0b' },
            ].map((s, i) => {
              const pct = s.target ? Math.round((s.val / s.target) * 100) : 100
              const col = pctColor(pct)
              return (
                <div key={s.label} style={{ flex: 1, textAlign: 'center', padding: m ? '0.4rem 0.25rem' : '0.5rem 0.25rem', borderRight: i < 3 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                  <div style={{ fontSize: '0.38rem', fontWeight: 700, color: 'rgba(255,255,255,0.15)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.1rem' }}>{s.label}</div>
                  <div style={{ fontSize: m ? '0.75rem' : '0.85rem', fontWeight: 800, color: col }}>{s.val}</div>
                  <div style={{ fontSize: '0.38rem', color: col, fontWeight: 700 }}>{pct}%</div>
                </div>
              )
            })}
          </div>
        )}

        {/* Modus knoppen */}
        <div style={{ display: 'flex', gap: '0.25rem', padding: m ? '0.4rem 0.75rem' : '0.5rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          {[
            { id: 'smart', label: '🎯 Slimme analyse' },
            { id: 'scale', label: '⚖️ Alles schalen' },
          ].map(opt => (
            <button key={opt.id} onClick={() => setMode(opt.id)} style={{
              flex: 1, padding: m ? '0.35rem 0' : '0.4rem 0',
              background: mode === opt.id ? 'rgba(255,215,0,0.06)' : 'transparent',
              border: `1px solid ${mode === opt.id ? 'rgba(255,215,0,0.25)' : 'rgba(255,255,255,0.06)'}`,
              borderRadius: '4px', color: mode === opt.id ? '#FFD700' : 'rgba(255,255,255,0.3)',
              fontSize: m ? '0.55rem' : '0.6rem', fontWeight: 700,
              cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', fontFamily: 'inherit'
            }}>{opt.label}</button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>

          {/* SLIMME ANALYSE MODE */}
          {mode === 'smart' && (
            <div>
              {dayAnalyses.map(({ dayIndex, day, analysis }) => {
                if (!analysis) return (
                  <div key={dayIndex} style={{ padding: m ? '0.4rem 0.75rem' : '0.5rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.03)', opacity: 0.3 }}>
                    <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>{DAYS_NL[dayIndex]}</span>
                    <span style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.2)', marginLeft: '0.5rem' }}>Geen maaltijden</span>
                  </div>
                )

                const isExpanded = selectedDay === dayIndex
                const hasIssues = analysis.issues.length > 0
                const appliedSet = appliedConcessies[dayIndex] || new Set()

                return (
                  <div key={dayIndex} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>

                    {/* Dag header */}
                    <button
                      onClick={() => setSelectedDay(isExpanded ? null : dayIndex)}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem',
                        padding: m ? '0.5rem 0.75rem' : '0.625rem 1rem',
                        background: isExpanded ? 'rgba(255,255,255,0.02)' : 'transparent',
                        border: 'none', cursor: 'pointer',
                        touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', fontFamily: 'inherit',
                        borderLeft: hasIssues ? `2px solid ${analysis.issues[0]?.macro === 'kcal' ? '#f59e0b' : '#ef4444'}` : '2px solid rgba(16,185,129,0.3)'
                      }}
                    >
                      {/* Dag naam */}
                      <span style={{ fontSize: m ? '0.65rem' : '0.7rem', fontWeight: 800, color: '#fff', width: m ? '60px' : '70px', flexShrink: 0, textAlign: 'left' }}>
                        {DAYS_NL[dayIndex]}
                      </span>

                      {/* Macro pills */}
                      <div style={{ display: 'flex', gap: '0.2rem', flex: 1 }}>
                        {[
                          { val: analysis.totals.kcal, target: targetOverride.calories, label: 'kcal', color: '#FFD700' },
                          { val: analysis.totals.protein, target: targetOverride.protein, label: 'E', color: '#10b981' },
                          { val: analysis.totals.fat, target: targetOverride.fat, label: 'V', color: '#f59e0b' },
                        ].map((s, i) => {
                          const pct = s.target ? Math.round((s.val / s.target) * 100) : 100
                          const col = pctColor(pct)
                          return (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.1rem', padding: '0.1rem 0.3rem', background: `${col}10`, border: `1px solid ${col}25`, borderRadius: '3px' }}>
                              <span style={{ fontSize: m ? '0.5rem' : '0.55rem', fontWeight: 800, color: col }}>{Math.round(s.val)}</span>
                              <span style={{ fontSize: '0.38rem', color: 'rgba(255,255,255,0.2)', fontWeight: 600 }}>{s.label}</span>
                            </div>
                          )
                        })}
                      </div>

                      {/* Issue badge */}
                      {hasIssues ? (
                        <span style={{ fontSize: '0.45rem', fontWeight: 800, color: '#f59e0b', background: 'rgba(245,158,11,0.1)', padding: '0.1rem 0.3rem', borderRadius: '3px', flexShrink: 0 }}>
                          {analysis.issues.length} issue{analysis.issues.length > 1 ? 's' : ''}
                        </span>
                      ) : (
                        <Check size={12} color="#10b981" />
                      )}

                      <ChevronRight size={12} color="rgba(255,255,255,0.2)" style={{ transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s ease', flexShrink: 0 }} />
                    </button>

                    {/* Uitgevouwen dag detail */}
                    {isExpanded && (
                      <div style={{ padding: m ? '0 0.75rem 0.75rem' : '0 1rem 0.875rem', background: 'rgba(255,255,255,0.01)' }}>

                        {/* Macro bars */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginBottom: '0.5rem', paddingTop: '0.4rem' }}>
                          {[
                            { label: 'Calorieën', val: analysis.totals.kcal, target: targetOverride.calories, color: '#FFD700', unit: 'kcal' },
                            { label: 'Eiwit',     val: analysis.totals.protein, target: targetOverride.protein, color: '#10b981', unit: 'g' },
                            { label: 'Carbs',     val: analysis.totals.carbs, target: targetOverride.carbs, color: '#3b82f6', unit: 'g' },
                            { label: 'Vet',       val: analysis.totals.fat, target: targetOverride.fat, color: '#f59e0b', unit: 'g' },
                          ].map(s => {
                            const pct = s.target ? Math.round((s.val / s.target) * 100) : 100
                            const col = pctColor(pct)
                            const barW = Math.min(100, pct)
                            return (
                              <div key={s.label}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.1rem' }}>
                                  <span style={{ fontSize: '0.48rem', fontWeight: 600, color: 'rgba(255,255,255,0.4)' }}>{s.label}</span>
                                  <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.5rem', fontWeight: 800, color: col }}>{Math.round(s.val)}{s.unit}</span>
                                    <span style={{ fontSize: '0.42rem', color: 'rgba(255,255,255,0.2)' }}>/{s.target}{s.unit}</span>
                                    <span style={{ fontSize: '0.42rem', fontWeight: 800, color: col }}>{pct}%</span>
                                    {pct > 108 && <TrendingUp size={9} color={col} />}
                                    {pct < 92 && <TrendingDown size={9} color={col} />}
                                    {pct >= 92 && pct <= 108 && <Check size={9} color={col} />}
                                  </div>
                                </div>
                                <div style={{ height: '4px', background: 'rgba(255,255,255,0.04)', borderRadius: '2px', overflow: 'hidden', position: 'relative' }}>
                                  <div style={{ height: '100%', width: `${barW}%`, background: col, borderRadius: '2px' }} />
                                  {/* Target lijn op 100% */}
                                  <div style={{ position: 'absolute', top: 0, bottom: 0, left: '88%', width: '1px', background: 'rgba(255,255,255,0.15)' }} />
                                </div>
                              </div>
                            )
                          })}
                        </div>

                        {/* Concessies */}
                        {analysis.concessies.length > 0 && (
                          <div>
                            <div style={{ fontSize: '0.42rem', fontWeight: 700, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.3rem' }}>
                              SUGGESTIES
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                              {analysis.concessies.map((c, ci) => {
                                const isApplied = appliedSet.has(c.description)
                                const macroColors = { kcal: '#FFD700', eiwit: '#10b981', vet: '#f59e0b', carbs: '#3b82f6' }
                                const col = macroColors[c.macro] || '#FFD700'
                                return (
                                  <div key={ci} style={{
                                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                                    padding: '0.4rem 0.5rem',
                                    background: isApplied ? 'rgba(16,185,129,0.06)' : 'rgba(255,255,255,0.02)',
                                    border: `1px solid ${isApplied ? 'rgba(16,185,129,0.2)' : `${col}20`}`,
                                    borderRadius: '6px'
                                  }}>
                                    <div style={{ width: '3px', height: '32px', borderRadius: '2px', background: col, flexShrink: 0 }} />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <div style={{ fontSize: m ? '0.55rem' : '0.6rem', fontWeight: 600, color: isApplied ? '#10b981' : '#fff', lineHeight: 1.4 }}>
                                        {c.description}
                                      </div>
                                      <div style={{ fontSize: '0.42rem', color: col, fontWeight: 700, marginTop: '0.1rem' }}>
                                        Impact: {c.impact}
                                      </div>
                                    </div>
                                    {c.type === 'scale_meal' && !isApplied && (
                                      <button onClick={() => applyConcessie(dayIndex, c)} style={{
                                        padding: '0.3rem 0.5rem', background: `${col}10`,
                                        border: `1px solid ${col}30`, borderRadius: '4px',
                                        color: col, fontSize: '0.5rem', fontWeight: 800,
                                        cursor: 'pointer', flexShrink: 0,
                                        touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', fontFamily: 'inherit'
                                      }}>
                                        Toepassen
                                      </button>
                                    )}
                                    {isApplied && <Check size={14} color="#10b981" />}
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}

                        {analysis.concessies.length === 0 && !hasIssues && (
                          <div style={{ fontSize: '0.55rem', color: '#10b981', fontWeight: 600, padding: '0.25rem 0' }}>
                            ✓ Deze dag is goed gebalanceerd
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* SCHAAL MODE */}
          {mode === 'scale' && (
            <div>
              <div style={{ padding: m ? '0.5rem 0.75rem' : '0.625rem 1rem', background: 'rgba(255,215,0,0.03)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.3)', lineHeight: 1.5 }}>
                  Alle maaltijden worden geschaald naar de ingestelde targets. Gewogen: 50% kcal, 30% eiwit, 20% vet.
                </div>
              </div>
              {dayAnalyses.map(({ dayIndex, analysis }) => {
                if (!analysis) return null
                const baseCal = Object.values(weekData[dayIndex]?.meals || {}).reduce((s, m) => s + (m?.original_calories || m?.calories || 0), 0)
                const baseProt = Object.values(weekData[dayIndex]?.meals || {}).reduce((s, m) => s + (m?.original_protein || m?.protein || 0), 0)
                const baseFat = Object.values(weekData[dayIndex]?.meals || {}).reduce((s, m) => s + (m?.original_fat || m?.fat || 0), 0)
                const rawCal = baseCal > 0 ? targetOverride.calories / baseCal : 1
                const rawProt = baseProt > 0 ? targetOverride.protein / baseProt : 1
                const rawFat = baseFat > 0 ? targetOverride.fat / baseFat : 1
                const sf = Math.max(0.3, Math.min(2.5, rawCal * 0.5 + rawProt * 0.3 + rawFat * 0.2))
                const newCal = Math.round(baseCal * sf)
                const pct = Math.round((newCal / targetOverride.calories) * 100)
                const col = pctColor(pct)
                return (
                  <div key={dayIndex} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: m ? '0.4rem 0.75rem' : '0.5rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <span style={{ fontSize: m ? '0.65rem' : '0.7rem', fontWeight: 700, color: '#fff', width: m ? '60px' : '70px', flexShrink: 0 }}>{DAYS_NL[dayIndex]}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.15rem' }}>
                        <span style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.25)' }}>
                          {Math.round(analysis.totals.kcal)} → <strong style={{ color: col }}>{newCal}</strong> kcal
                        </span>
                        <span style={{ fontSize: '0.5rem', fontWeight: 800, color: col }}>{pct}%</span>
                      </div>
                      <div style={{ height: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${Math.min(100, pct)}%`, background: col, borderRadius: '2px' }} />
                      </div>
                    </div>
                    <span style={{ fontSize: '0.48rem', fontWeight: 700, color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>×{sf.toFixed(2)}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: m ? '0.625rem 0.75rem' : '0.75rem 1rem', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: '0.5rem' }}>
          {mode === 'smart' && (
            <button onClick={onClose} style={{
              flex: 1, padding: m ? '0.5rem' : '0.625rem',
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '6px', color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem', fontWeight: 700,
              cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minHeight: '40px', fontFamily: 'inherit'
            }}>Sluiten</button>
          )}
          {mode === 'scale' && (
            <button onClick={handleScaleAll} disabled={applied} style={{
              flex: 1, padding: m ? '0.5rem' : '0.625rem',
              background: applied ? '#10b981' : '#FFD700',
              border: 'none', borderRadius: '6px',
              color: '#000', fontSize: m ? '0.7rem' : '0.8rem', fontWeight: 800,
              cursor: applied ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem',
              minHeight: '44px', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', fontFamily: 'inherit'
            }}>
              {applied ? <><Check size={14} /> Toegepast!</> : <><Zap size={14} /> Schaal alle {daysWithMeals} dagen</>}
            </button>
          )}
        </div>
      </div>
    </div>
  )

  return createPortal(modal, modalHost)
}
