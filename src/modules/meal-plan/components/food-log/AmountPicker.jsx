// src/modules/meal-plan/components/food-log/AmountPicker.jsx
// 🎯 v7.0 — Geeft amount + per_unit door bij onLog zodat re-open op juiste portie kan
// Behoudt MFP scroll picker + dropdown UI

import React, { useState, useRef, useEffect } from 'react'
import MealCard from '../day-schedule/MealCard'
import { resolveFoodImage } from '../../foodImageFallback'
import { Check } from 'lucide-react'
import { findPortionConfig, stukVan, stukTekst } from './portionPresets'
import GramInvoer from '../GramInvoer'

// ═══════════════════════════════════════════
// SCROLL PICKER MODAL (MFP style)
// ═══════════════════════════════════════════

function ScrollPickerModal({ value, onConfirm, onClose, isMobile }) {
  const wholeRef = useRef(null)
  const fracRef = useRef(null)

  const initWhole = Math.floor(value)
  const initFrac = value - initWhole

  const [whole, setWhole] = useState(initWhole)
  const [fracIndex, setFracIndex] = useState(0)

  const fractions = [
    { label: '-', value: 0 },
    { label: '⅛', value: 0.125 },
    { label: '¼', value: 0.25 },
    { label: '⅓', value: 0.333 },
    { label: '½', value: 0.5 },
    { label: '⅔', value: 0.667 },
    { label: '¾', value: 0.75 }
  ]

  useEffect(() => {
    const closest = fractions.reduce((prev, curr, idx) =>
      Math.abs(curr.value - initFrac) < Math.abs(fractions[prev].value - initFrac) ? idx : prev, 0)
    setFracIndex(closest)
  }, [])

  useEffect(() => {
    const itemH = 48
    if (wholeRef.current) {
      wholeRef.current.scrollTop = whole * itemH - (wholeRef.current.clientHeight / 2) + (itemH / 2)
    }
    if (fracRef.current) {
      fracRef.current.scrollTop = fracIndex * itemH - (fracRef.current.clientHeight / 2) + (itemH / 2)
    }
  }, [])

  const wholeNumbers = Array.from({ length: 1000 }, (_, i) => i)

  const combined = whole + fractions[fracIndex].value
  const displayValue = fractions[fracIndex].value > 0
    ? `${whole > 0 ? whole : ''}${fractions[fracIndex].label}`
    : `${whole}`

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.7)',
      zIndex: 10010, display: 'flex', flexDirection: 'column',
      justifyContent: 'flex-end', animation: 'apFadeIn 0.15s ease'
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: '#111', borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px 16px 0 0', overflow: 'hidden',
        animation: 'apSlideUp 0.2s ease'
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: isMobile ? '0.75rem 1rem' : '0.875rem 1.25rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
        }}>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: 'rgba(255, 255, 255, 0.4)',
            fontSize: isMobile ? '0.8rem' : '0.85rem', fontWeight: '600',
            cursor: 'pointer', touchAction: 'manipulation'
          }}>
            Annuleren
          </button>
          <div style={{ fontSize: isMobile ? '0.9rem' : '0.95rem', fontWeight: '800', color: '#fff' }}>
            {displayValue}
          </div>
          <button onClick={() => onConfirm(combined)} style={{
            background: 'none', border: 'none', color: '#fff',
            fontSize: isMobile ? '0.8rem' : '0.85rem', fontWeight: 900,
            cursor: 'pointer', touchAction: 'manipulation'
          }}>
            OK
          </button>
        </div>

        <div style={{
          display: 'flex', borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
          padding: '0.3rem 0'
        }}>
          <div style={{
            flex: 1, textAlign: 'center', fontSize: '0.5rem', fontWeight: '700',
            color: 'rgba(255, 255, 255, 0.2)', textTransform: 'uppercase', letterSpacing: '0.06em'
          }}>Getal</div>
          <div style={{
            flex: 1, textAlign: 'center', fontSize: '0.5rem', fontWeight: '700',
            color: 'rgba(255, 255, 255, 0.2)', textTransform: 'uppercase', letterSpacing: '0.06em'
          }}>Breuk</div>
        </div>

        <div style={{ display: 'flex', height: isMobile ? '220px' : '260px' }}>
          <div ref={wholeRef} style={{
            flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch',
            borderRight: '1px solid rgba(255, 255, 255, 0.04)'
          }}>
            {wholeNumbers.map(n => (
              <div key={n} onClick={() => { setWhole(n); if (navigator.vibrate) navigator.vibrate(8) }} style={{
                height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: n === whole ? (isMobile ? '1.25rem' : '1.4rem') : (isMobile ? '0.85rem' : '0.95rem'),
                fontWeight: n === whole ? '800' : '500',
                color: n === whole ? '#fff' : 'rgba(255, 255, 255, 0.2)',
                background: n === whole ? 'rgba(255, 215, 0, 0.06)' : 'transparent',
                cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent'
              }}>{n}</div>
            ))}
          </div>

          <div ref={fracRef} style={{
            flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch'
          }}>
            {fractions.map((f, idx) => (
              <div key={f.label} onClick={() => { setFracIndex(idx); if (navigator.vibrate) navigator.vibrate(8) }} style={{
                height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: idx === fracIndex ? (isMobile ? '1.25rem' : '1.4rem') : (isMobile ? '0.85rem' : '0.95rem'),
                fontWeight: idx === fracIndex ? '800' : '500',
                color: idx === fracIndex ? '#fff' : 'rgba(255, 255, 255, 0.2)',
                background: idx === fracIndex ? 'rgba(255, 215, 0, 0.06)' : 'transparent',
                cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent'
              }}>{f.label}</div>
            ))}
          </div>
        </div>

        <div style={{ height: isMobile ? '1.5rem' : '0.5rem' }} />
      </div>

      <style>{`
        @keyframes apFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes apSlideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
      `}</style>
    </div>
  )
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

const MEAL_MOMENTS = [
  { id: 'breakfast', label: 'Ontbijt' },
  { id: 'lunch', label: 'Lunch' },
  { id: 'dinner', label: 'Avondeten', kort: 'Diner' },
  { id: 'snack', label: 'Tussendoortjes', kort: 'Snack' }
]

const getDefaultMoment = () => {
  const hour = new Date().getHours()
  if (hour < 11) return 'breakfast'
  if (hour < 15) return 'lunch'
  if (hour < 20) return 'dinner'
  return 'snack'
}

const DEFAULT_GRAM_PRESETS = [1, 30, 50, 100]

const buildGramOptions = (learnedGrams = []) => {
  // Always keep "1 gram" as the exact option, then fill remaining 3 slots
  // first from learned values (sorted by use_count via order they're loaded),
  // then from defaults.
  const result = [{ id: 'gram', label: '1 gram', grams: 1 }]
  const others = []
  for (const g of learnedGrams) {
    const n = Math.round(Number(g))
    if (!Number.isFinite(n) || n <= 0 || n === 1) continue
    if (!others.includes(n)) others.push(n)
    if (others.length >= 3) break
  }
  for (const g of DEFAULT_GRAM_PRESETS) {
    if (others.length >= 3) break
    if (g === 1) continue
    if (!others.includes(g)) others.push(g)
  }
  for (const g of others) {
    result.push({ id: `g${g}`, label: `${g} gram`, grams: g })
  }
  return result
}

const GRAM_OPTIONS = buildGramOptions()

const MEAL_OPTIONS = [
  { id: 'portion', label: '1 portie', grams: 1, isMultiplier: true }
]

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

export default function AmountPicker({ item, onLog, isMobile, defaultMealMoment, db, client, loggingService }) {
  // Geen vroege return vóór de hooks: React eist dat elke render dezelfde
  // hooks in dezelfde volgorde draait, en met `if (!item) return null` bovenaan
  // stond dit hele bestand in de linter als fout. De hooks gaan uit van een
  // ontbrekend item; de render stopt eronder alsnog.
  const isPer100g = item?.per100g === true

  const [gramOptions, setGramOptions] = useState(GRAM_OPTIONS)
  const servingOptions = isPer100g ? gramOptions : MEAL_OPTIONS

  // Initial state
  const [selectedServing, setSelectedServing] = useState(servingOptions[0])
  // Wanneer een portie-preset z'n eigen macros heeft (bv. "1 eiwit (los)"
  // gebruikt egg-white macros ipv het gemiddelde hele-ei profiel), zetten
  // we die hier neer. Math gebruikt deze macros als per-100g-basis ipv de
  // item-macros. Wordt geleegd zodra de gebruiker via de dropdown een
  // andere portie kiest.
  const [baseMacrosOverride, setBaseMacrosOverride] = useState(null)

  // De samenstelling komt in drie vormen binnen: met naam en macro's, met
  // ingredient_name/amount_gram, of als kale verwijzing {ingredient_id,
  // amount}. Die laatste toonde hier vijf regels "Ingrediënt" zonder waarden;
  // daarom zoeken we de namen en macro's erbij op.
  const [ingredientRegels, setIngredientRegels] = useState([])
  // Eenmalig aangepaste hoeveelheden per ingrediënt (index -> gram), alleen
  // voor deze log. De vaste maaltijd zelf blijft zoals hij is.
  const [ingGram, setIngGram] = useState({})
  useEffect(() => {
    const ruw = Array.isArray(item?.ingredients) ? item.ingredients : []
    const basis = ruw.map(ing => ({
      ...ing,
      name: ing?.name || ing?.ingredient_name || ing?.naam || null,
      amount: ing?.amount ?? ing?.amount_gram ?? null,
      unit: ing?.unit || (ing?.amount_gram != null ? 'gram' : 'g'),
    }))
    setIngredientRegels(basis.map(i => ({ ...i, name: i.name || 'Ingrediënt' })))
    // Ander item: eigen aanpassingen van het vorige horen er niet bij.
    setIngGram({})

    const ids = [...new Set(basis.filter(i => !i.name && i.ingredient_id).map(i => i.ingredient_id))]
    if (ids.length === 0 || !db?.supabase) return
    let afgebroken = false
    db.supabase
      .from('ai_ingredients')
      .select('id, name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g')
      .in('id', ids)
      .then(({ data }) => {
        if (afgebroken || !data) return
        const opId = new Map(data.map(r => [r.id, r]))
        setIngredientRegels(basis.map(i => {
          const bron = i.name ? null : opId.get(i.ingredient_id)
          if (!bron) return { ...i, name: i.name || 'Ingrediënt' }
          const gram = Number(i.amount) || 0
          const deel = gram / 100
          return {
            ...i,
            name: bron.name,
            calories: Math.round((bron.calories_per_100g || 0) * deel),
            protein: Math.round((bron.protein_per_100g || 0) * deel),
            carbs: Math.round((bron.carbs_per_100g || 0) * deel),
            fat: Math.round((bron.fat_per_100g || 0) * deel),
          }
        }))
      }, (e) => console.error('Ingrediënten opzoeken mislukt:', e))
    return () => { afgebroken = true }
  }, [item, db])

  // Load learned portion sizes per ingredient and rebuild dropdown
  useEffect(() => {
    if (!isPer100g || !loggingService || !client?.id || !item?.name) return
    let cancelled = false
    loggingService.getPortionHistory(client.id, item.name, 4).then(learned => {
      if (cancelled) return
      const next = buildGramOptions(learned)
      setGramOptions(next)
      // Keep currently-selected grams if it's still in the list, else fall back
      // to the matching option or first.
      setSelectedServing(prev => {
        const stillThere = next.find(o => o.grams === prev.grams)
        return stillThere || next[0]
      })
    })
    return () => { cancelled = true }
  }, [item?.name, client?.id, loggingService, isPer100g])

  // 🎯 BELANGRIJK: gebruik opgeslagen amount uit recent als die er is
  // Anders: default 100g voor per100g, 1 portie voor meal
  const initialQuantity = item?._savedAmount !== undefined && item?._savedAmount !== null
    ? item._savedAmount
    : (isPer100g ? (item?.defaultPortion || 100) : 1)

  const [quantity, setQuantity] = useState(initialQuantity)
  const [showQuantityPicker, setShowQuantityPicker] = useState(false)
  const [saving, setSaving] = useState(false)
  const [mealMoment, setMealMoment] = useState(defaultMealMoment || getDefaultMoment())

  if (!item) return null

  // ═══ MACRO BEREKENING ═══
  // Voor recents met _savedAmount + _basePer (eerder gelogde meal):
  //   - macros zijn TOTALEN voor _savedAmount
  //   - factor = quantity / _savedAmount (linear scaling)
  // Voor verse ingredient items (per100g):
  //   - macros zijn per 100g
  //   - factor = totalGrams / 100
  // Voor verse meal items (portion):
  //   - macros zijn per 1 portie
  //   - factor = quantity (multiplier)

  let factor
  let totalGrams // alleen relevant voor per100g/gram items

  // Corrupt-data-detectie: in zeldzame gevallen heeft een recent-item een
  // anker van bv. amount=3 met per_unit='gram' terwijl calories=465. Dat
  // impliceert 155 kcal per gram — fysiek onmogelijk (max ~9 kcal/g voor
  // pure oliën). Vermoedelijk een unit-count die per ongeluk als gram is
  // opgeslagen. Bij zulke rows valt de math terug op per-100g.
  //
  // We KIJKEN niet meer puur naar "< 10 gram" — dat trof onterecht
  // legitieme kleine porties zoals 5g olijfolie (8.2 kcal/g, OK).
  const impliedDensity = (isPer100g
    && item._savedAmount > 0
    && (item._savedPerUnit === 'gram' || !item._savedPerUnit))
    ? Math.abs((item.calories || 0) / item._savedAmount)
    : 0
  const savedAmountSuspect = impliedDensity > 12
  const useSavedAnchor =
    !savedAmountSuspect
    && item._savedAmount !== undefined
    && item._savedAmount !== null
    && item._savedAmount > 0

  if (useSavedAnchor) {
    // Recent item — macros zijn totalen voor _savedAmount, schaal lineair.
    // totalGrams (of voor portion: quantity) gedeeld door savedAmount geeft
    // de juiste factor ook als de gebruiker via de dropdown een ander
    // portiegrootte-unit kiest.
    totalGrams = selectedServing.isMultiplier ? quantity : quantity * selectedServing.grams
    factor = totalGrams / item._savedAmount
  } else if (isPer100g) {
    // Vers ingrediënt — macros per 100g
    totalGrams = selectedServing.isMultiplier ? quantity : quantity * selectedServing.grams
    factor = totalGrams / 100
  } else {
    // Verse meal — macros per portie
    totalGrams = quantity
    factor = quantity
  }

  // Wanneer er een preset-specifieke macro-basis is (bv. eigeel/eiwit los),
  // gebruiken we die per-100g-waarden in plaats van item.*; de factor blijft
  // hetzelfde dus quantity-aanpassingen schalen netjes mee.
  const macroBase = baseMacrosOverride || {
    calories: item.calories || 0,
    protein: item.protein || 0,
    carbs: item.carbs || 0,
    fat: item.fat || 0,
  }
  const standaardMacros = {
    calories: Math.round((macroBase.calories || 0) * factor),
    protein: Math.round((macroBase.protein || 0) * factor * 10) / 10,
    carbs: Math.round((macroBase.carbs || 0) * factor * 10) / 10,
    fat: Math.round((macroBase.fat || 0) * factor * 10) / 10
  }

  // Samenstelling voor deze log: elk ingrediënt op zijn geschaalde hoeveelheid,
  // of op wat je er zelf van maakte. Is er iets aangepast, dan tellen de
  // macro's op uit de ingrediënten in plaats van uit het maaltijdtotaal.
  const heeftSamenstelling = !isPer100g && ingredientRegels.length > 0
  const samenstelling = ingredientRegels.map((ing, i) => {
    const baseAmt = Number(ing.amount) || 0
    const geschaald = baseAmt > 0 ? Math.round(baseAmt * (factor || 1)) : 0
    const nu = ingGram[i] !== undefined ? Math.max(0, Number(ingGram[i]) || 0) : geschaald
    const deel = baseAmt > 0 ? nu / baseAmt : 1
    return {
      ...ing,
      amount: nu,
      calories: Math.round((Number(ing.calories) || 0) * deel),
      protein: Math.round((Number(ing.protein) || 0) * deel * 10) / 10,
      carbs: Math.round((Number(ing.carbs) || 0) * deel * 10) / 10,
      fat: Math.round((Number(ing.fat) || 0) * deel * 10) / 10,
    }
  })
  const ingAangepast = heeftSamenstelling && Object.keys(ingGram).length > 0
  const macros = ingAangepast
    ? samenstelling.reduce((t, r) => ({
        calories: t.calories + r.calories, protein: t.protein + r.protein,
        carbs: t.carbs + r.carbs, fat: t.fat + r.fat,
      }), { calories: 0, protein: 0, carbs: 0, fat: 0 })
    : standaardMacros


  const handleLog = async () => {
    setSaving(true)
    try {
      // Bepaal per_unit voor opslag
      let per_unit = null
      let amountToSave = null

      if (item._savedAmount !== undefined && item._savedAmount !== null) {
        // Recent item — gebruik dezelfde unit als opgeslagen.
        // Belangrijk: voor per100g-items moet `amount` het totaal in grammen
        // zijn, niet `quantity`. Anders gaat de `× grams` uit de dropdown
        // verloren (bv. dropdown "100 gram" × quantity 3 = 300g, maar zonder
        // deze schaling wordt het als amount=3 weggeschreven terwijl de
        // macros voor 300g zijn berekend). Dat triggerde een corrupt-data-
        // detectie bij latere relogs.
        per_unit = item._savedPerUnit || (isPer100g ? 'gram' : 'portion')
        amountToSave = isPer100g ? totalGrams : quantity
      } else if (isPer100g) {
        per_unit = 'gram'
        amountToSave = totalGrams
      } else {
        per_unit = 'portion'
        amountToSave = quantity
      }

      await onLog({
        name: item.name,
        sourceId: item.id,
        type: item.type || 'custom',
        calories: macros.calories,
        protein: Math.round(macros.protein),
        carbs: Math.round(macros.carbs),
        fat: Math.round(macros.fat),
        // Aangepast? Dan de samenstelling zoals gelogd, zodat je hem bij
        // opnieuw bewerken terugziet. De vaste maaltijd blijft ongewijzigd.
        ingredients: ingAangepast
          ? samenstelling.map(({ name, amount, unit, calories, protein, carbs, fat, ingredient_id }) => ({
              name, amount, unit: unit || 'gram', calories, protein, carbs, fat,
              ...(ingredient_id ? { ingredient_id } : {}),
            }))
          : (item.ingredients || []),
        source: item.source || 'manual_log',
        image_url: item.image_url,
        amount: amountToSave,
        per_unit: per_unit,
        per100g: isPer100g,
        brand: item.brand || null,
        barcode: item.barcode || null,
        meal_type: mealMoment
      })
    } catch {
      setSaving(false)
    }
  }

  const displayQuantity = (val) => {
    const whole = Math.floor(val)
    const frac = val - whole
    const fractionMap = [
      { v: 0.125, s: '⅛' }, { v: 0.25, s: '¼' }, { v: 0.333, s: '⅓' },
      { v: 0.5, s: '½' }, { v: 0.667, s: '⅔' }, { v: 0.75, s: '¾' }
    ]
    const closest = fractionMap.find(f => Math.abs(f.v - frac) < 0.05)
    if (frac === 0) return `${whole}`
    if (whole === 0 && closest) return closest.s
    if (closest) return `${whole} ${closest.s}`
    return `${val}`
  }

  // ── Weergave (15 okt 2026: alles gecentreerd, geen uitklaplijsten) ──
  const gramStand = isPer100g && (selectedServing.id === 'gram' || selectedServing.grams === 1)
  const gramOpt = gramOptions.find(o => o.id === 'gram') || gramOptions[0]
  const stuk = isPer100g ? stukVan(item.name) : null
  const stap = gramStand ? (stuk?.grams || 10) : (isPer100g ? 1 : 0.5)
  const zetGram = (g) => { setSelectedServing(gramOpt); setBaseMacrosOverride(null); setQuantity(g) }
  const kies = (fn) => { fn(); if (navigator.vibrate) navigator.vibrate(12) }
  const eenheidTekst = gramStand
    ? 'gram'
    : isPer100g ? `× ${selectedServing.label}` : (quantity === 1 ? 'portie' : 'porties')

  // Snelle porties: natuurlijke porties (1 ei, 1 sneetje) en daarna de
  // gram-voorkeuren. Bewerkte producten (jam, sap, yoghurt) krijgen geen
  // "stuks" van het losse fruit: "Aardbeien Jam" kreeg "5 stuks · 75g".
  const cfg = isPer100g ? findPortionConfig(item.name) : null
  const bewerkt = /\b(jam|confituur|sap|siroop|limonade|yoghurt|kwark|smoothie|drink|saus|thee|ijs|taart|vla|pudding)\b/i.test(item.name || '')
  const presets = bewerkt && cfg?.displayUnit === 'stuks' ? [] : (cfg?.presets || [])
  const gramChips = isPer100g
    ? gramOptions.filter(o => o.id !== 'gram' && !presets.some(p => p.grams === o.grams)).map(o => o.grams)
    : []

  const chip = (aan) => ({
    padding: '0 0.85rem', minHeight: 36, borderRadius: 999,
    background: aan ? '#fff' : 'rgba(255,255,255,0.05)',
    border: `1px solid ${aan ? '#fff' : 'rgba(255,255,255,0.12)'}`,
    color: aan ? '#0a0a0a' : 'rgba(255,255,255,0.75)',
    fontSize: isMobile ? '0.8rem' : '0.85rem', fontWeight: 800, fontFamily: 'inherit',
    cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
    whiteSpace: 'nowrap', flexShrink: 0,
  })
  const plusMin = {
    width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)',
    color: '#fff', fontSize: '1.6rem', fontWeight: 700, lineHeight: 1, fontFamily: 'inherit',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
  }
  const kopje = {
    fontSize: '0.62rem', fontWeight: 800, color: 'rgba(255,255,255,0.35)',
    letterSpacing: '0.08em', textTransform: 'uppercase', textAlign: 'center', marginBottom: '0.55rem',
  }
  const foto = resolveFoodImage(item)

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      paddingTop: isMobile ? '3.5rem' : '4rem'
    }}>
      {/* Product */}
      <div style={{ textAlign: 'center', padding: isMobile ? '0.5rem 1rem 0' : '0.75rem 1.5rem 0' }}>
        {foto && (
          <img src={foto} alt="" style={{
            width: 76, height: 76, borderRadius: '50%', objectFit: 'cover',
            border: '1px solid rgba(255,255,255,0.12)', display: 'block', margin: '0 auto 0.7rem',
          }} />
        )}
        <div style={{
          fontSize: isMobile ? '1.35rem' : '1.5rem', fontWeight: 900, color: '#fff',
          letterSpacing: '-0.025em', lineHeight: 1.2, maxWidth: 420, margin: '0 auto',
        }}>{item.name}</div>
        {item.brand && (
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginTop: 3 }}>
            {item.brand}
          </div>
        )}
      </div>

      {/* Hoeveelheid: groot getal met − en + */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: isMobile ? 18 : 26, marginTop: isMobile ? '1.4rem' : '1.75rem' }}>
        <button aria-label="Minder" style={plusMin}
          onClick={() => kies(() => setQuantity(q => Math.max(stap, Math.round((q - stap) * 100) / 100)))}>−</button>
        <button onClick={() => setShowQuantityPicker(true)} style={{
          background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'inherit',
          minWidth: 120, textAlign: 'center',
        }}>
          <div style={{ fontSize: isMobile ? '3.2rem' : '3.6rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
            {displayQuantity(quantity)}
          </div>
          <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
            {eenheidTekst}
          </div>
        </button>
        <button aria-label="Meer" style={plusMin}
          onClick={() => kies(() => setQuantity(q => Math.round((q + stap) * 100) / 100))}>+</button>
      </div>
      {(gramStand && stuk && quantity > 0) || (!gramStand && isPer100g) ? (
        <div style={{ textAlign: 'center', fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>
          {gramStand ? stukTekst(quantity, stuk) : `${Math.round(totalGrams)} gram`}
        </div>
      ) : null}

      {/* Snelle porties */}
      {isPer100g && (presets.length > 0 || gramChips.length > 0) && (
        <div style={{ marginTop: isMobile ? '1.25rem' : '1.5rem' }}>
          <div style={kopje}>Snelle portie</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', padding: '0 1rem' }}>
            {presets.map((p, i) => {
              const aan = gramStand && Math.abs(quantity - p.grams) < 0.5
              return (
                <button key={`p${i}`} style={chip(aan)} onClick={() => kies(() => {
                  setSelectedServing(gramOpt); setQuantity(p.grams); setBaseMacrosOverride(p.override || null)
                })}>
                  {p.label}<span style={{ opacity: 0.55, fontWeight: 700 }}> · {p.grams}{cfg?.displayUnit === 'ml' ? 'ml' : 'g'}</span>
                </button>
              )
            })}
            {gramChips.map(g => (
              <button key={`g${g}`} style={chip(gramStand && quantity === g)} onClick={() => kies(() => zetGram(g))}>
                {g} g
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Moment */}
      <div style={{ marginTop: isMobile ? '1.25rem' : '1.5rem' }}>
        <div style={kopje}>Moment</div>
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap', padding: '0 1rem' }}>
          {MEAL_MOMENTS.map(m => (
            <button key={m.id} style={chip(mealMoment === m.id)} onClick={() => kies(() => setMealMoment(m.id))}>
              {m.kort || m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Macro's: vier getallen, geen vakken */}
      <div style={{
        display: 'flex', justifyContent: 'center', gap: isMobile ? 22 : 34,
        margin: isMobile ? '1.5rem 1rem 1.25rem' : '1.75rem 1.5rem 1.5rem',
        paddingTop: isMobile ? '1.1rem' : '1.25rem', borderTop: '1px solid rgba(255,255,255,0.07)',
      }}>
        {[
          { label: 'kcal', waarde: macros.calories, kleur: '#10b981' },
          { label: 'eiwit', waarde: `${Math.round(macros.protein)}g`, kleur: '#3b82f6' },
          { label: 'koolh', waarde: `${Math.round(macros.carbs)}g`, kleur: '#ec4899' },
          { label: 'vet', waarde: `${Math.round(macros.fat)}g`, kleur: '#f59e0b' },
        ].map(m => (
          <div key={m.label} style={{ textAlign: 'center', minWidth: 0 }}>
            <div style={{ fontSize: isMobile ? '1.3rem' : '1.45rem', fontWeight: 900, color: '#fff', lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>
              {m.waarde}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, marginTop: 4, fontSize: '0.62rem', fontWeight: 800, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: m.kleur }} />{m.label}
            </div>
          </div>
        ))}
      </div>

      {/* Samenstelling — toon de ingrediënten van een vaste maaltijd zodat je
          ziet waaruit hij bestaat (i.p.v. de misleidende "100 gram"-portie).
          Hoeveelheden schalen mee met het gekozen aantal porties (factor). */}
      {!isPer100g && Array.isArray(item.ingredients) && item.ingredients.length > 0 && (
        <div style={{
          padding: isMobile ? '0 1rem 1rem' : '0 1.5rem 1.25rem',
          borderBottom: '1px solid rgba(255,255,255,0.06)'
        }}>
          <div style={{
            fontSize: '0.58rem', fontWeight: 700, color: 'rgba(255,255,255,0.3)',
            textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 0.5rem'
          }}>
            Samenstelling ({item.ingredients.length})
            {ingAangepast && (
              <button
                onClick={() => setIngGram({})}
                style={{
                  marginLeft: 8, background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                  color: '#fff', fontSize: '0.62rem', fontWeight: 800, textTransform: 'none', letterSpacing: 0,
                  fontFamily: 'inherit', textDecoration: 'underline',
                }}
              >
                Herstel
              </button>
            )}
          </div>
          {ingAangepast && (
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'rgba(255,255,255,0.55)', margin: '-0.2rem 0 0.5rem' }}>
              Alleen voor deze keer; je vaste maaltijd blijft hetzelfde.
            </div>
          )}
          <div style={{ margin: isMobile ? '0 -1rem' : '0 -1.5rem' }}>
            {samenstelling.map((ing, i) => {
              const eenheid = ing.unit === 'gram' || ing.unit === 'g' || !ing.unit ? 'g' : ing.unit
              const stuk = eenheid === 'g' ? stukVan(ing.name) : null
              return (
                <MealCard
                  key={i}
                  meal={{
                    name: ing.name,
                    image_url: resolveFoodImage(ing),
                    calories: Math.round(ing.calories || 0),
                    protein: Math.round(ing.protein || 0),
                    carbs: Math.round(ing.carbs || 0),
                    fat: Math.round(ing.fat || 0),
                  }}
                  momentLabel=""
                  rechts={
                    <GramInvoer
                      waarde={ing.amount}
                      eenheid={eenheid}
                      stap={stuk?.grams || (eenheid === 'g' ? 10 : 1)}
                      stuk={stuk}
                      zet={(v) => setIngGram(prev => ({ ...prev, [i]: v }))}
                    />
                  }
                  isMobile={isMobile}
                  acties={[]}
                />
              )
            })}
          </div>
        </div>
      )}

      <div style={{ flex: 1 }} />

      {/* Registreer */}
      <div style={{
        padding: isMobile ? '0.75rem 1rem' : '1rem 1.5rem',
        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
        paddingBottom: isMobile ? '2rem' : '1.5rem'
      }}>
        <button onClick={handleLog} disabled={saving || macros.calories === 0} style={{
          width: '100%', padding: isMobile ? '0.875rem' : '1rem',
          background: '#fff',
          border: 'none',
          borderRadius: 12,
          color: '#0a0a0a', fontSize: isMobile ? '0.9rem' : '0.95rem',
          fontWeight: 900, cursor: saving ? 'wait' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: '0.5rem', minHeight: '48px',
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          opacity: (saving || macros.calories === 0) ? 0.5 : 1
        }}
          onTouchStart={(e) => { if (isMobile && !saving) e.currentTarget.style.transform = 'scale(0.98)' }}
          onTouchEnd={(e) => { if (isMobile) e.currentTarget.style.transform = 'scale(1)' }}
        >
          <Check size={16} strokeWidth={2.5} />
          {saving ? 'Opslaan…' : 'Loggen'}
        </button>
      </div>

      {showQuantityPicker && (
        <ScrollPickerModal
          value={quantity}
          onConfirm={(val) => { setQuantity(val); setShowQuantityPicker(false) }}
          onClose={() => setShowQuantityPicker(false)}
          isMobile={isMobile}
        />
      )}
    </div>
  )
}
