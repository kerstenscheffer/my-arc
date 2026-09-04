// src/modules/ai-meal-generator/tabs/plan-analyzer/AutoBalancer.jsx
// Auto-balance modal — calculates portion adjustments to hit day targets
// v1.2 — fix: scale op original_calories, clamp 3.0, all-mode rawScaleFactor

import React, { useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useModalHost } from '../../../../coach/ModalHost'
import { X, Zap, ArrowRight, Check } from 'lucide-react'

export default function AutoBalancer({ dayData, targets, dayIndex, onApply, onClose, isMobile, embedded = false }) {
  const modalHost = useModalHost()
  const [mode, setMode] = useState('all')
  const [applied, setApplied] = useState(false)
  const m = isMobile

  const totals = dayData?.totals || {}
  const cal = totals.kcal || totals.calories || 0
  const prot = totals.protein || 0

  // ── Gebruik original_calories als basis voor scale als die aanwezig zijn ──
  // Dit voorkomt dat al-geschaalde waarden nog een keer worden geschaald
  const getBaseCal = (meal) => meal.original_calories || meal.calories || 0
  const getBaseProt = (meal) => meal.original_protein || meal.protein || 0

  const baseTotals = useMemo(() => {
    if (!dayData?.meals) return { cal: 0, prot: 0 }
    const meals = Object.values(dayData.meals).filter(Boolean)
    return {
      cal: meals.reduce((s, m) => s + getBaseCal(m), 0),
      prot: meals.reduce((s, m) => s + getBaseProt(m), 0)
    }
  }, [dayData])

  console.log('🔧 AutoBalancer | mount', {
    dayIndex,
    mode,
    currentTotals: { cal, prot, carbs: totals.carbs, fat: totals.fat },
    baseTotals,
    targets,
    mealsCount: dayData?.meals ? Object.keys(dayData.meals).length : 0
  })

  const preview = useMemo(() => {
    if (!dayData?.meals || !targets) {
      console.warn('⚠️ AutoBalancer | geen dayData.meals of targets', { dayData, targets })
      return []
    }

    const meals = Object.entries(dayData.meals).filter(([, meal]) => meal)
    if (meals.length === 0) {
      console.warn('⚠️ AutoBalancer | geen maaltijden gevonden in dag')
      return []
    }

    const targetCal = targets.calories || 2500
    const targetProt = targets.protein || 150

    // Gebruik base totals (original waarden) als basis voor scale factor
    const baseCal = baseTotals.cal > 0 ? baseTotals.cal : cal
    const baseProt = baseTotals.prot > 0 ? baseTotals.prot : prot

    let scaleFactor = 1
    let rawCalFactor = baseCal > 0 ? targetCal / baseCal : 1
    let rawProtFactor = baseProt > 0 ? targetProt / baseProt : 1

    if (mode === 'calories') {
      scaleFactor = rawCalFactor
    } else if (mode === 'protein') {
      scaleFactor = rawProtFactor
    } else {
      // 'all': gewogen mix — cal 60%, eiwit 40%
      scaleFactor = (rawCalFactor * 0.6 + rawProtFactor * 0.4)
    }

    // Clamp ruimer: min 0.3, max 3.0 — grote correcties moeten mogelijk zijn
    scaleFactor = Math.max(0.3, Math.min(3.0, scaleFactor))

    console.log('⚡ AutoBalancer | scale berekening', {
      mode,
      baseCal,
      baseProt,
      rawCalFactor: rawCalFactor.toFixed(3),
      rawProtFactor: rawProtFactor.toFixed(3),
      clampedScaleFactor: scaleFactor.toFixed(3),
      targetCal,
      targetProt,
      currentCal: cal,
      currentProt: prot
    })

    const result = meals.map(([slot, meal]) => {
      // Schaal altijd vanuit de originele base waarden
      const baseMealCal = getBaseCal(meal)
      const baseMealProt = getBaseProt(meal)
      const baseMealCarbs = meal.original_carbs || meal.carbs || 0
      const baseMealFat = meal.original_fat || meal.fat || 0

      const newCal = Math.round(baseMealCal * scaleFactor)
      const newProt = Math.round(baseMealProt * scaleFactor * 10) / 10
      const newCarbs = Math.round(baseMealCarbs * scaleFactor * 10) / 10
      const newFat = Math.round(baseMealFat * scaleFactor * 10) / 10

      // Scale ingredients als aanwezig
      let newIngredients = meal.ingredients_list
      if (meal.ingredients_list && typeof meal.ingredients_list === 'object' && !Array.isArray(meal.ingredients_list)) {
        newIngredients = {}
        Object.entries(meal.ingredients_list).forEach(([name, amount]) => {
          newIngredients[name] = typeof amount === 'number' ? Math.round(amount * scaleFactor) : amount
        })
      } else if (Array.isArray(meal.ingredients_list)) {
        newIngredients = meal.ingredients_list.map(ing => {
          if (ing && typeof ing.amount === 'number') {
            return { ...ing, amount: Math.round(ing.amount * scaleFactor) }
          }
          return ing
        })
      }

      return {
        slot,
        originalMeal: meal,
        scaledMeal: {
          ...meal,
          calories: newCal,
          protein: newProt,
          carbs: newCarbs,
          fat: newFat,
          ingredients_list: newIngredients,
          scale_factor: scaleFactor,
          // Bewaar originele waarden voor toekomstige balancing
          original_calories: baseMealCal,
          original_protein: baseMealProt,
          original_carbs: baseMealCarbs,
          original_fat: baseMealFat
        },
        scaleFactor,
        calDiff: newCal - (meal.calories || 0),
        protDiff: newProt - (meal.protein || 0)
      }
    })

    console.log('📊 AutoBalancer | preview resultaat', result.map(p => ({
      slot: p.slot,
      naam: p.originalMeal.name,
      base: `${Math.round(getBaseCal(p.originalMeal))}kcal (original)`,
      huidig: `${Math.round(p.originalMeal.calories)}kcal`,
      naar: `${p.scaledMeal.calories}kcal / ${p.scaledMeal.protein}g eiwit`,
      verschil: `${p.calDiff > 0 ? '+' : ''}${Math.round(p.calDiff)} kcal`
    })))

    return result
  }, [dayData, targets, mode, baseTotals])

  const newTotals = useMemo(() => {
    const t = { kcal: 0, protein: 0, carbs: 0, fat: 0 }
    preview.forEach(p => {
      t.kcal += p.scaledMeal.calories || 0
      t.protein += p.scaledMeal.protein || 0
      t.carbs += p.scaledMeal.carbs || 0
      t.fat += p.scaledMeal.fat || 0
    })
    return t
  }, [preview])

  const handleApply = () => {
    const updatedMeals = {}
    preview.forEach(p => { updatedMeals[p.slot] = p.scaledMeal })

    console.log('✅ AutoBalancer | apply', {
      dayIndex,
      mode,
      nieuweTotals: {
        kcal: Math.round(newTotals.kcal),
        protein: Math.round(newTotals.protein),
        carbs: Math.round(newTotals.carbs),
        fat: Math.round(newTotals.fat)
      },
      targets,
      scaleFactor: preview[0]?.scaleFactor,
      aantalMaaltijden: Object.keys(updatedMeals).length
    })

    onApply(dayIndex, updatedMeals)
    setApplied(true)
    setTimeout(() => onClose(), 800)
  }

  const scalePct = Math.round((preview[0]?.scaleFactor || 1) * 100)
  const SLOT_LABELS = {
    breakfast: 'Ontbijt', lunch: 'Lunch', dinner: 'Diner',
    snack1: 'Snack 1', snack2: 'Snack 2', snack3: 'Snack 3'
  }

  // Accuraatheid na balancing
  const calAccuracy = targets?.calories ? Math.round((newTotals.kcal / targets.calories) * 100) : 0
  const protAccuracy = targets?.protein ? Math.round((newTotals.protein / targets.protein) * 100) : 0

  const modal = (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.92)',
      zIndex: 10000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center'
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#0a0a0a', borderRadius: '16px 16px 0 0',
        width: '100%', maxWidth: '580px', maxHeight: '80vh',
        display: 'flex', flexDirection: 'column', overflow: 'hidden'
      }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: m ? '0.625rem 0.75rem' : '0.75rem 1rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
        }}>
          <div>
            <div style={{ fontSize: m ? '0.85rem' : '0.95rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Zap size={16} color="#FFD700" /> Auto-Balance
            </div>
            <div style={{ fontSize: m ? '0.5rem' : '0.55rem', color: 'rgba(255,255,255,0.3)' }}>
              Porties schalen naar targets ({scalePct}% van origineel)
            </div>
          </div>
          <button onClick={onClose} style={{
            width: '32px', height: '32px', borderRadius: '6px', background: 'transparent',
            border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.3)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent'
          }}><X size={16} /></button>
        </div>

        {/* Mode selector */}
        <div style={{
          display: 'flex', gap: '0.25rem',
          padding: m ? '0.5rem 0.75rem' : '0.5rem 1rem',
          borderBottom: '1px solid rgba(255,255,255,0.04)'
        }}>
          {[
            { id: 'all', label: 'Alles balanceren' },
            { id: 'calories', label: 'Alleen kcal' },
            { id: 'protein', label: 'Alleen eiwit' }
          ].map(opt => (
            <button key={opt.id} onClick={() => setMode(opt.id)} style={{
              flex: 1, padding: m ? '0.35rem 0' : '0.4rem 0',
              background: mode === opt.id ? 'rgba(255, 215, 0, 0.06)' : 'transparent',
              border: `1px solid ${mode === opt.id ? 'rgba(255, 215, 0, 0.25)' : 'rgba(255,255,255,0.06)'}`,
              borderRadius: '3px', color: mode === opt.id ? '#FFD700' : 'rgba(255,255,255,0.3)',
              fontSize: m ? '0.55rem' : '0.6rem', fontWeight: 700,
              cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent'
            }}>{opt.label}</button>
          ))}
        </div>

        {/* Macro vergelijking */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(255, 215, 0, 0.02)'
        }}>
          {[
            { l: 'KCAL', old: cal, new: newTotals.kcal, target: targets?.calories },
            { l: 'EIWIT', old: prot, new: newTotals.protein, target: targets?.protein },
            { l: 'CARBS', old: totals.carbs || 0, new: newTotals.carbs, target: targets?.carbs },
            { l: 'VET', old: totals.fat || 0, new: newTotals.fat, target: targets?.fat }
          ].map((s, i) => {
            const pctNew = s.target ? Math.round((s.new / s.target) * 100) : 0
            const isGood = pctNew >= 90 && pctNew <= 110
            return (
              <div key={s.l} style={{
                flex: 1, textAlign: 'center', padding: m ? '0.4rem 0' : '0.5rem 0',
                borderRight: i < 3 ? '1px solid rgba(255,255,255,0.04)' : 'none'
              }}>
                <div style={{ fontSize: '0.35rem', fontWeight: 700, color: 'rgba(255,255,255,0.15)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.l}</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.15rem', marginTop: '0.1rem' }}>
                  <span style={{ fontSize: m ? '0.6rem' : '0.65rem', fontWeight: 700, color: 'rgba(255,255,255,0.25)', textDecoration: 'line-through' }}>{Math.round(s.old)}</span>
                  <ArrowRight size={8} color="rgba(255,255,255,0.15)" />
                  <span style={{ fontSize: m ? '0.75rem' : '0.85rem', fontWeight: 800, color: isGood ? '#10b981' : '#f59e0b' }}>{Math.round(s.new)}</span>
                </div>
                <div style={{ fontSize: '0.35rem', color: 'rgba(255,255,255,0.15)', marginTop: '0.05rem' }}>doel: {s.target || 0}</div>
                {s.target > 0 && (
                  <div style={{ fontSize: '0.35rem', color: isGood ? '#10b981' : '#f59e0b', fontWeight: 700 }}>{pctNew}%</div>
                )}
              </div>
            )
          })}
        </div>

        {/* Waarschuwing als scale extreem is */}
        {(scalePct < 60 || scalePct > 200) && (
          <div style={{
            padding: m ? '0.35rem 0.75rem' : '0.4rem 1rem',
            background: 'rgba(245, 158, 11, 0.06)',
            borderBottom: '1px solid rgba(245, 158, 11, 0.15)',
            fontSize: '0.5rem', color: '#f59e0b', fontWeight: 700
          }}>
            ⚠️ Grote aanpassing ({scalePct}%) — overweeg maaltijden te swappen in plaats van schalen
          </div>
        )}

        {/* Meal preview */}
        <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
          {preview.length === 0 && (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '0.65rem' }}>
              Geen maaltijden gevonden
            </div>
          )}
          {preview.map(p => (
            <div key={p.slot} style={{
              display: 'flex', alignItems: 'center',
              padding: m ? '0.4rem 0.75rem' : '0.5rem 1rem',
              borderBottom: '1px solid rgba(255,255,255,0.03)',
              gap: '0.5rem'
            }}>
              <div style={{ width: '50px', flexShrink: 0 }}>
                <div style={{ fontSize: '0.4rem', fontWeight: 700, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase' }}>
                  {SLOT_LABELS[p.slot] || p.slot}
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: m ? '0.7rem' : '0.75rem', fontWeight: 700, color: '#fff', marginBottom: '0.1rem' }}>
                  {p.originalMeal.name}
                </div>
                <div style={{ display: 'flex', gap: '0.3rem', fontSize: m ? '0.5rem' : '0.55rem', flexWrap: 'wrap' }}>
                  <span style={{ color: 'rgba(255,255,255,0.25)' }}>{Math.round(p.originalMeal.calories)} →</span>
                  <span style={{ fontWeight: 800, color: '#FFD700' }}>{Math.round(p.scaledMeal.calories)} kcal</span>
                  <span style={{ color: p.calDiff > 0 ? '#10b981' : '#ef4444', fontWeight: 700 }}>
                    ({p.calDiff > 0 ? '+' : ''}{Math.round(p.calDiff)})
                  </span>
                  <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
                  <span style={{ color: 'rgba(255,255,255,0.4)' }}>{p.scaledMeal.protein}g eiwit</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Apply button */}
        <div style={{ padding: m ? '0.625rem 0.75rem' : '0.75rem 1rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={handleApply} disabled={applied || preview.length === 0} style={{
            width: '100%', padding: m ? '0.625rem' : '0.75rem',
            background: applied ? '#10b981' : '#FFD700',
            border: 'none', borderRadius: '6px',
            color: '#000', fontSize: m ? '0.75rem' : '0.85rem', fontWeight: 800,
            cursor: applied || preview.length === 0 ? 'default' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem',
            minHeight: '44px', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            opacity: preview.length === 0 ? 0.4 : 1
          }}>
            {applied
              ? <><Check size={16} /> Toegepast!</>
              : <><Zap size={16} /> Balanceer naar {targets?.calories} kcal / {targets?.protein}g eiwit</>
            }
          </button>
        </div>
      </div>
    </div>
  )

  // Embedded: render inline in een getransformeerde container zodat de
  // fixed-modal binnen het dock-paneel valt i.p.v. over het hele scherm.
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
