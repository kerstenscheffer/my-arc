// src/modules/meal-plan/components/food-log/AmountPicker.jsx
// 🎯 v7.0 — Geeft amount + per_unit door bij onLog zodat re-open op juiste portie kan
// Behoudt MFP scroll picker + dropdown UI

import React, { useState, useEffect } from 'react'
import MealCard from '../day-schedule/MealCard'
import { resolveFoodImage } from '../../foodImageFallback'
import { Check, ChevronDown } from 'lucide-react'
import { findPortionConfig, stukVan, stukTekst, meervoud } from './portionPresets'
import GramInvoer from '../GramInvoer'

// ═══════════════════════════════════════════
// HOEVEELHEID INTYPEN (15 okt 2026; was een draaiwiel met breuken)
// ═══════════════════════════════════════════
// Eén groot invoerveld met het numerieke toetsenbord. Bij porties staan er
// knopjes voor halve en kwart porties; bij grammen niet, die tik je in.

function HoeveelheidInvoer({ value, eenheid, porties = false, onConfirm, onClose, isMobile }) {
  const [tekst, setTekst] = useState(String(value ?? ''))
  const getal = parseFloat(String(tekst).replace(',', '.'))
  const geldig = Number.isFinite(getal) && getal > 0
  const bevestig = () => { if (geldig) onConfirm(Math.round(getal * 100) / 100) }
  const snel = porties ? [0.25, 0.5, 0.75, 1, 1.5, 2] : []
  const breuk = (v) => ({ 0.25: '¼', 0.5: '½', 0.75: '¾', 1.5: '1½' }[v] || String(v))

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
      zIndex: 10010, display: 'flex', flexDirection: 'column',
      justifyContent: isMobile ? 'flex-end' : 'center', alignItems: 'center',
      animation: 'apFadeIn 0.15s ease',
    }}>
      <style>{'@keyframes apFadeIn { from { opacity: 0 } to { opacity: 1 } } @keyframes apSlideUp { from { transform: translateY(24px); opacity: 0 } to { transform: none; opacity: 1 } }'}</style>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: '100%', maxWidth: 440, background: '#0f0f0f',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: isMobile ? '20px 20px 0 0' : 20,
        padding: isMobile ? '1.25rem 1rem calc(1.25rem + env(safe-area-inset-bottom, 0px))' : '1.5rem',
        animation: 'apSlideUp 0.2s ease', textAlign: 'center',
      }}>
        <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#fff' }}>Hoeveelheid</div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 8, margin: '1rem 0 0.25rem' }}>
          <input
            type="text" inputMode="decimal" autoFocus value={tekst}
            onFocus={e => e.target.select()}
            onChange={e => setTekst(e.target.value.replace(/[^0-9.,]/g, ''))}
            onKeyDown={e => { if (e.key === 'Enter') bevestig() }}
            style={{
              width: `${Math.max(2, String(tekst).length + 0.5)}ch`, minWidth: '2.5ch', maxWidth: '70%',
              background: 'none', border: 'none', outline: 'none', padding: 0,
              color: '#fff', fontSize: '3.4rem', fontWeight: 900, letterSpacing: '-0.04em',
              textAlign: 'center', fontFamily: 'inherit', fontVariantNumeric: 'tabular-nums',
              borderBottom: '2px solid rgba(255,255,255,0.25)',
            }}
          />
          <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'rgba(255,255,255,0.5)' }}>{eenheid}</span>
        </div>
        {snel.length > 0 && (
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap', marginTop: '0.9rem' }}>
            {snel.map(v => {
              const aan = geldig && Math.abs(getal - v) < 0.01
              return (
                <button key={v} onClick={() => setTekst(String(v))} style={{
                  minWidth: 46, minHeight: 38, padding: '0 0.7rem', borderRadius: 999,
                  background: aan ? '#fff' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${aan ? '#fff' : 'rgba(255,255,255,0.12)'}`,
                  color: aan ? '#0a0a0a' : '#fff', fontSize: '0.95rem', fontWeight: 900,
                  fontFamily: 'inherit', cursor: 'pointer', touchAction: 'manipulation',
                }}>{breuk(v)}</button>
              )
            })}
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, marginTop: '1.25rem' }}>
          <button onClick={onClose} style={{
            flex: 1, minHeight: 50, borderRadius: 14, background: 'transparent',
            border: '1px solid rgba(255,255,255,0.14)', color: 'rgba(255,255,255,0.7)',
            fontSize: '0.95rem', fontWeight: 800, fontFamily: 'inherit', cursor: 'pointer',
          }}>Annuleren</button>
          <button onClick={bevestig} disabled={!geldig} style={{
            flex: 2, minHeight: 50, borderRadius: 14, border: 'none',
            background: '#fff', color: '#0a0a0a', fontSize: '0.95rem', fontWeight: 900,
            fontFamily: 'inherit', cursor: geldig ? 'pointer' : 'default', opacity: geldig ? 1 : 0.4,
          }}>Klaar</button>
        </div>
      </div>
    </div>
  )
}

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

// Portie-opties per product (15 okt 2026). Volgorde in de kiezer:
//   1. de basiseenheid: 1 gram, of 1 ml bij drinken
//   2. natuurlijke porties uit portionPresets: 1 ei, 1 snee, 1 eetlepel, 1 glas
//   3. vaste hoeveelheden: wat de klant vaak logt, aangevuld met 30/50/100 g
//      of 50/100 ml
// Meervouden ("2 eieren") staan er niet in: dat is aantal × 1 ei.
const VASTE_GRAM = [30, 50, 100]
const VASTE_ML = [50, 100]

const buildGramOptions = (naam = '') => {
  const cfg = findPortionConfig(naam)
  const ml = cfg?.displayUnit === 'ml'
  const u = ml ? 'ml' : 'g'
  const result = [{ id: 'gram', label: ml ? '1 ml' : '1 gram', knop: `1 ${u}`, grams: 1, unit: u }]
  const natuurlijk = (cfg?.presets || []).filter(p =>
    p.grams > 1 && !/^(?!1\s)(\d|½)/.test(p.label) && !/^\d+\s?(g|ml)\b/i.test(p.label))
  natuurlijk.forEach((p, i) => {
    const enkel = p.label.replace(/^1\s+/, '')
    result.push({
      id: `n${i}`, label: p.label, sub: `${p.grams} ${u}`, knop: enkel, grams: p.grams, unit: u,
      natuurlijk: true, enkel, meer: meervoud(enkel), override: p.override || null,
    })
  })
  // Alleen de vaste stappen; eigen logs (40 g, 75 g) maakten de lijst druk.
  const vast = [...(ml ? VASTE_ML : VASTE_GRAM)]
  vast
    .filter(g => !natuurlijk.some(p => p.grams === g))
    .sort((x, y) => x - y)
    .forEach(g => result.push({ id: `g${g}`, label: `${g} ${ml ? 'ml' : 'gram'}`, knop: `${g} ${u}`, grams: g, unit: u }))
  return result
}

const MEAL_OPTIONS = [
  { id: 'portion', label: '1 portie', grams: 1, isMultiplier: true }
]

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

export default function AmountPicker({ item, onLog, isMobile, defaultMealMoment, db }) {
  // Geen vroege return vóór de hooks: React eist dat elke render dezelfde
  // hooks in dezelfde volgorde draait, en met `if (!item) return null` bovenaan
  // stond dit hele bestand in de linter als fout. De hooks gaan uit van een
  // ontbrekend item; de render stopt eronder alsnog.
  const isPer100g = item?.per100g === true

  const [gramOptions] = useState(() => buildGramOptions(item?.name))
  const servingOptions = isPer100g ? gramOptions : MEAL_OPTIONS

  // Nieuw product met een natuurlijke portie: begin op "1 ei" / "1 snee" in
  // plaats van 100 gram. Een eerder gelogd item houdt zijn grammen.
  const startNatuurlijk = isPer100g && !(item?._savedAmount > 0)
    ? (servingOptions.find(o => o.natuurlijk && String(item?.name || '').toLowerCase().includes(o.enkel.toLowerCase()))
      || servingOptions.find(o => o.natuurlijk) || null)
    : null

  // Initial state
  const [selectedServing, setSelectedServing] = useState(startNatuurlijk || servingOptions[0])
  // Wanneer een portie-preset z'n eigen macros heeft (bv. "1 eiwit (los)"
  // gebruikt egg-white macros ipv het gemiddelde hele-ei profiel), zetten
  // we die hier neer. Math gebruikt deze macros als per-100g-basis ipv de
  // item-macros. Wordt geleegd zodra de gebruiker via de dropdown een
  // andere portie kiest.
  const [baseMacrosOverride, setBaseMacrosOverride] = useState(startNatuurlijk?.override || null)

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


  // 🎯 BELANGRIJK: gebruik opgeslagen amount uit recent als die er is
  // Anders: default 100g voor per100g, 1 portie voor meal
  const initialQuantity = item?._savedAmount !== undefined && item?._savedAmount !== null
    ? item._savedAmount
    : (isPer100g ? (item?.defaultPortion || 100) : 1)

  const [quantity, setQuantity] = useState(startNatuurlijk ? 1 : initialQuantity)
  const [editingQty, setEditingQty] = useState(false)
  const [editQtyText, setEditQtyText] = useState('')
  const [portieOpen, setPortieOpen] = useState(false)
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
  const gramStand = isPer100g && selectedServing.id === 'gram'
  const u = isPer100g ? (gramOptions[0]?.unit || 'g') : 'g'
  const stuk = isPer100g ? stukVan(item.name) : null
  const stap = gramStand ? (u === 'ml' ? 50 : (stuk?.grams || 10)) : (isPer100g ? 1 : 0.5)
  const kies = (fn) => { fn(); if (navigator.vibrate) navigator.vibrate(12) }
  const eenheidTekst = gramStand
    ? (u === 'ml' ? 'ml' : 'gram')
    : selectedServing.natuurlijk ? (quantity === 1 ? selectedServing.enkel : selectedServing.meer)
    : isPer100g ? `× ${selectedServing.grams} ${u}` : (quantity === 1 ? 'portie' : 'porties')
  // Portiegrootte links van het aantal: 1 gram (dan is het aantal in grammen)
  // of een vaste portie van 30/50/100 g (dan is het aantal porties).
  const kiesPortie = (opt) => {
    const totaal = Math.round(totalGrams) || 0
    setSelectedServing(opt)
    setBaseMacrosOverride(null)
    setBaseMacrosOverride(opt.override || null)
    if (opt.id === 'gram') setQuantity(totaal > 0 ? totaal : (item.defaultPortion || 100))
    else setQuantity(1)
    setPortieOpen(false)
  }

  const plusMin = {
    width: 44, height: 52, flexShrink: 0, padding: 0,
    background: 'none', border: 'none', outline: 'none',
    color: 'rgba(255,255,255,0.85)', fontSize: '2.2rem', fontWeight: 800, lineHeight: 1, fontFamily: 'inherit',
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

      {/* Hoeveelheid: − getal + strak naast elkaar; de eenheid eronder is
          zelf de portie-kiezer ("gram ▾", "theelepels ▾"). */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: isMobile ? 14 : 20, marginTop: isMobile ? '1.4rem' : '1.75rem', padding: '0 1rem' }}>
        <button aria-label="Minder" style={plusMin}
          onClick={() => kies(() => setQuantity(q => Math.max(stap, Math.round((q - stap) * 100) / 100)))}>−</button>
        {editingQty ? (
          <input
            type="text"
            inputMode="decimal"
            autoFocus
            value={editQtyText}
            onChange={e => setEditQtyText(e.target.value.replace(/[^0-9.,]/g, ''))}
            onFocus={e => e.target.select()}
            onBlur={() => {
              const v = parseFloat(String(editQtyText).replace(',', '.'))
              if (Number.isFinite(v) && v > 0) setQuantity(Math.round(v * 100) / 100)
              setEditingQty(false)
            }}
            onKeyDown={e => { if (e.key === 'Enter') e.target.blur() }}
            style={{
              background: 'none', border: 'none', outline: 'none', padding: 0,
              fontFamily: 'inherit',
              fontSize: isMobile ? '3.4rem' : '3.8rem', fontWeight: 900, color: '#fff',
              letterSpacing: '-0.04em', lineHeight: 1, fontVariantNumeric: 'tabular-nums',
              width: `${Math.max(2, editQtyText.length + 0.5)}ch`, minWidth: '1.6ch',
              textAlign: 'center', borderBottom: '2px solid rgba(255,255,255,0.5)',
              WebkitTapHighlightColor: 'transparent',
            }}
          />
        ) : (
          <button onClick={() => { setEditingQty(true); setEditQtyText(String(quantity)) }} style={{
            background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'inherit', outline: 'none',
            fontSize: isMobile ? '3.4rem' : '3.8rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.04em',
            lineHeight: 1, fontVariantNumeric: 'tabular-nums', minWidth: '1.6ch', textAlign: 'center',
            WebkitTapHighlightColor: 'transparent',
          }}>
            {displayQuantity(quantity)}
          </button>
        )}
        <button aria-label="Meer" style={plusMin}
          onClick={() => kies(() => setQuantity(q => Math.round((q + stap) * 100) / 100))}>+</button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 6 }}>
        {isPer100g ? (
          <div style={{ position: 'relative' }}>
            <button onClick={() => setPortieOpen(o => !o)} aria-label="Portiegrootte" style={{
              display: 'flex', alignItems: 'center', gap: 4, padding: '2px 4px', minHeight: 32,
              background: 'none', border: 'none', outline: 'none', color: '#fff', fontFamily: 'inherit', cursor: 'pointer',
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            }}>
              <span style={{ fontSize: '0.95rem', fontWeight: 800, borderBottom: '2px solid rgba(255,255,255,0.3)', paddingBottom: 1, whiteSpace: 'nowrap' }}>
                {eenheidTekst}
              </span>
              <ChevronDown size={15} strokeWidth={3} style={{ opacity: 0.6, transform: portieOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
            </button>
            {portieOpen && (
              <>
                <div onClick={() => setPortieOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 20 }} />
                <div style={{
                  position: 'absolute', top: 'calc(100% + 6px)', left: '50%', transform: 'translateX(-50%)', zIndex: 21,
                  minWidth: 190, background: '#141414', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 14,
                  padding: 4, boxShadow: '0 16px 40px rgba(0,0,0,0.7)',
                }}>
                  {servingOptions.map(opt => {
                    const aan = opt.id === selectedServing.id
                    return (
                      <button key={opt.id} onClick={() => kies(() => kiesPortie(opt))} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14,
                        width: '100%', height: 38, padding: '0 0.75rem', borderRadius: 10,
                        background: aan ? '#fff' : 'transparent', border: 'none', outline: 'none', textAlign: 'left',
                        color: aan ? '#0a0a0a' : '#fff', fontSize: '0.86rem', fontWeight: aan ? 900 : 700,
                        fontFamily: 'inherit', cursor: 'pointer', whiteSpace: 'nowrap',
                        WebkitTapHighlightColor: 'transparent',
                      }}>
                        <span>{opt.label}</span>
                        {opt.sub && <span style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.5 }}>{opt.sub}</span>}
                      </button>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        ) : (
          <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'rgba(255,255,255,0.55)' }}>{eenheidTekst}</span>
        )}
      </div>
      {(gramStand && stuk && u === 'g' && quantity > 0) || (!gramStand && isPer100g) ? (
        <div style={{ textAlign: 'center', fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
          {gramStand ? stukTekst(quantity, stuk) : `${Math.round(totalGrams)} ${u === 'ml' ? 'ml' : 'gram'}`}
        </div>
      ) : null}

      {/* Moment */}
      <div style={{ marginTop: isMobile ? '1.25rem' : '1.5rem' }}>
        <div style={kopje}>Moment</div>
        {/* Eén schuifbalk, zoals Zoeken / Scannen bovenin: het witte blokje
            schuift naar het gekozen moment. */}
        {(() => {
          const idx = Math.max(0, MEAL_MOMENTS.findIndex(m => m.id === mealMoment))
          const n = MEAL_MOMENTS.length
          return (
            <div style={{ padding: '0 1rem', display: 'flex', justifyContent: 'center' }}>
              <div style={{
                position: 'relative', display: 'flex', width: '100%', maxWidth: 420,
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 999, padding: 3,
              }}>
                <div style={{
                  position: 'absolute', top: 3, bottom: 3,
                  left: `calc(3px + (100% - 6px) * ${idx / n})`, width: `calc((100% - 6px) / ${n})`,
                  background: '#fff', borderRadius: 999,
                  transition: 'left 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                }} />
                {MEAL_MOMENTS.map(m => {
                  const aan = mealMoment === m.id
                  return (
                    <button key={m.id} onClick={() => kies(() => setMealMoment(m.id))} style={{
                      position: 'relative', zIndex: 1, flex: 1, minWidth: 0, minHeight: 38,
                      background: 'transparent', border: 'none', borderRadius: 999,
                      color: aan ? '#0a0a0a' : 'rgba(255,255,255,0.6)',
                      fontSize: isMobile ? '0.8rem' : '0.85rem', fontWeight: aan ? 900 : 800,
                      fontFamily: 'inherit', cursor: 'pointer', transition: 'color 0.15s ease',
                      touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                    }}>
                      {m.kort || m.label}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })()}
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

    </div>
  )
}
