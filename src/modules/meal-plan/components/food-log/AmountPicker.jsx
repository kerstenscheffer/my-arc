// src/modules/meal-plan/components/food-log/AmountPicker.jsx
// 🎯 v7.0 — Geeft amount + per_unit door bij onLog zodat re-open op juiste portie kan
// Behoudt MFP scroll picker + dropdown UI

import React, { useState, useRef, useEffect } from 'react'
import { Check } from 'lucide-react'
import { findPortionConfig } from './portionPresets'

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
            background: 'none', border: 'none', color: '#FFD700',
            fontSize: isMobile ? '0.8rem' : '0.85rem', fontWeight: '700',
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
  { id: 'dinner', label: 'Avondeten' },
  { id: 'snack', label: 'Tussendoortjes' }
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

export default function AmountPicker({ item, remaining, onLog, onCancel, isMobile, defaultMealMoment, db, client, loggingService }) {
  if (!item) return null

  // Bepaal of dit een per100g item is (ingrediënt) of een portie item (meal)
  const isPer100g = item.per100g === true

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
  const initialQuantity = item._savedAmount !== undefined && item._savedAmount !== null
    ? item._savedAmount
    : (isPer100g ? (item.defaultPortion || 100) : 1)

  const [quantity, setQuantity] = useState(initialQuantity)
  const [showServingDropdown, setShowServingDropdown] = useState(false)
  const [showMealDropdown, setShowMealDropdown] = useState(false)
  const [showQuantityPicker, setShowQuantityPicker] = useState(false)
  const [saving, setSaving] = useState(false)
  const [mealMoment, setMealMoment] = useState(defaultMealMoment || getDefaultMoment())

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
  const macros = {
    calories: Math.round((macroBase.calories || 0) * factor),
    protein: Math.round((macroBase.protein || 0) * factor * 10) / 10,
    carbs: Math.round((macroBase.carbs || 0) * factor * 10) / 10,
    fat: Math.round((macroBase.fat || 0) * factor * 10) / 10
  }

  const totalG = macros.protein + macros.carbs + macros.fat
  const protPct = totalG > 0 ? Math.round((macros.protein / totalG) * 100) : 0
  const carbPct = totalG > 0 ? Math.round((macros.carbs / totalG) * 100) : 0
  const fatPct = totalG > 0 ? 100 - protPct - carbPct : 0

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
        ingredients: item.ingredients || [],
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

  const currentMealLabel = MEAL_MOMENTS.find(m => m.id === mealMoment)?.label || 'Ontbijt'

  // ── Row ──
  const Row = ({ label, children }) => (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: isMobile ? '0.875rem 1rem' : '1rem 1.5rem',
      borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
      minHeight: '48px'
    }}>
      <div style={{
        fontSize: isMobile ? '0.85rem' : '0.9rem',
        fontWeight: '500', color: 'rgba(255, 255, 255, 0.6)'
      }}>{label}</div>
      {children}
    </div>
  )

  const DropdownBtn = ({ label, onClick, active }) => (
    <button onClick={onClick} style={{
      padding: isMobile ? '0.5rem 0.75rem' : '0.5rem 0.875rem',
      background: active ? 'rgba(255, 215, 0, 0.06)' : 'transparent',
      border: `1px solid ${active ? 'rgba(255, 215, 0, 0.2)' : 'rgba(255, 255, 255, 0.1)'}`,
      borderRadius: '8px',
      color: active ? '#FFD700' : '#fff',
      fontSize: isMobile ? '0.8rem' : '0.85rem', fontWeight: '600',
      cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
      minHeight: '36px'
    }}>{label}</button>
  )

  const DropdownMenu = ({ options, selected, onSelect, onClose: closeMenu }) => (
    <>
      <div onClick={closeMenu} style={{ position: 'fixed', inset: 0, zIndex: 99 }} />
      <div style={{
        position: 'absolute', top: '100%', right: 0,
        marginTop: '0.25rem', zIndex: 100,
        background: '#111', border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '8px', overflow: 'hidden', minWidth: '160px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)'
      }}>
        {options.map((opt, i) => (
          <button key={opt.id} onClick={() => onSelect(opt)} style={{
            display: 'block', width: '100%',
            padding: isMobile ? '0.75rem' : '0.625rem 0.75rem',
            background: selected === opt.id ? 'rgba(255, 215, 0, 0.08)' : 'transparent',
            border: 'none',
            borderBottom: i < options.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
            color: selected === opt.id ? '#FFD700' : 'rgba(255, 255, 255, 0.7)',
            fontSize: isMobile ? '0.8rem' : '0.85rem',
            fontWeight: selected === opt.id ? '700' : '500',
            cursor: 'pointer', textAlign: 'left',
            touchAction: 'manipulation', minHeight: '44px'
          }}>{opt.label}</button>
        ))}
      </div>
    </>
  )

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      paddingTop: isMobile ? '3.5rem' : '4rem'
    }}>
      <div style={{
        padding: isMobile ? '1rem 1rem 0.25rem' : '1.25rem 1.5rem 0.375rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
      }}>
        <div style={{
          fontSize: isMobile ? '1.25rem' : '1.4rem',
          fontWeight: '800', color: '#fff', letterSpacing: '-0.02em'
        }}>{item.name}</div>
        {item.brand && (
          <div style={{ fontSize: isMobile ? '0.75rem' : '0.8rem', color: 'rgba(255, 255, 255, 0.3)', marginTop: '0.15rem' }}>
            {item.brand}
          </div>
        )}
      </div>

      {/* Portiegrootte — dropdown ook voor recents */}
      <Row label="Portiegrootte">
        <div style={{ position: 'relative' }}>
          <DropdownBtn
            label={selectedServing.label}
            onClick={() => setShowServingDropdown(!showServingDropdown)}
            active={showServingDropdown}
          />
          {showServingDropdown && (
            <DropdownMenu
              options={servingOptions}
              selected={selectedServing.id}
              onSelect={(opt) => {
                setSelectedServing(opt)
                setShowServingDropdown(false)
                // Dropdown-keuze betekent dat de gebruiker bewust van een
                // preset-shortcut wegnavigeert — overrider macro-basis
                // legen zodat we weer met de gewone item-macros rekenen.
                setBaseMacrosOverride(null)
                if (opt.id === 'gram') setQuantity(item.defaultPortion || 100)
                else setQuantity(1)
              }}
              onClose={() => setShowServingDropdown(false)}
            />
          )}
        </div>
      </Row>

      {/* Aantal — unit zit nu in Portiegrootte, dus dit is gewoon de multiplier */}
      {(() => {
        const aantalLabel = isPer100g ? 'Aantal' : 'Aantal porties'
        return (
          <Row label={aantalLabel}>
            <button onClick={() => setShowQuantityPicker(true)} style={{
              padding: isMobile ? '0.5rem 0.75rem' : '0.5rem 0.875rem',
              background: 'transparent',
              border: '1px solid rgba(255, 215, 0, 0.3)',
              borderRadius: '8px', color: '#FFD700',
              fontSize: isMobile ? '1.1rem' : '1.2rem', fontWeight: '800',
              cursor: 'pointer',
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              minHeight: '36px', minWidth: '60px', textAlign: 'center'
            }}>
              {displayQuantity(quantity)}
            </button>
          </Row>
        )
      })()}

      {/* Quick-pick portion presets — toon natuurlijke porties voor bekende
          ingrediënten (1 ei, 2 eieren, 1 schaaltje kwark, 1 glas melk, …).
          Tapping zet de portiegrootte op gram en stelt het juiste aantal in.
          Alleen voor per100g ingrediënten — meals (porties) volgen een eigen
          schaal en hebben hier geen baat bij. */}
      {isPer100g && (() => {
        const cfg = findPortionConfig(item.name)
        const presets = cfg?.presets || []
        if (presets.length === 0) return null
        const isPresetActive = (preset) =>
          selectedServing.id === 'gram' && Math.abs(quantity - preset.grams) < 0.5
        return (
          <div style={{
            padding: isMobile ? '0.625rem 1rem 0.75rem' : '0.75rem 1.5rem 0.875rem',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}>
            <div style={{
              fontSize: '0.55rem', fontWeight: 800,
              color: 'rgba(255,255,255,0.35)',
              letterSpacing: '0.06em', textTransform: 'uppercase',
              marginBottom: '0.4rem',
            }}>
              Snelle portie
            </div>
            <div style={{
              display: 'flex', gap: '0.4rem',
              flexWrap: 'wrap',
              paddingBottom: 2,
            }}>
              {presets.map((p, i) => {
                const active = isPresetActive(p)
                return (
                  <button
                    key={`${p.label}-${i}`}
                    onClick={() => {
                      // Force gram-serving (id 'gram', grams 1) so quantity = grams.
                      const gramOpt = gramOptions.find(o => o.id === 'gram') || gramOptions[0]
                      setSelectedServing(gramOpt)
                      setQuantity(p.grams)
                      // Pas de per-100g basis aan als de preset een eigen
                      // macro-profiel heeft (bv. eigeel/eiwit los), anders
                      // val terug op de standaard item-macros.
                      setBaseMacrosOverride(p.override || null)
                      if (navigator.vibrate) navigator.vibrate(15)
                    }}
                    style={{
                      padding: isMobile ? '0.45rem 0.7rem' : '0.5rem 0.8rem',
                      background: active ? 'rgba(255,215,0,0.18)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${active ? 'rgba(255,215,0,0.45)' : 'rgba(255,255,255,0.1)'}`,
                      borderRadius: 999,
                      color: active ? '#FFD700' : 'rgba(255,255,255,0.75)',
                      fontSize: isMobile ? '0.72rem' : '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent',
                      whiteSpace: 'nowrap',
                      minHeight: 30,
                    }}
                  >
                    {p.label}
                    <span style={{
                      marginLeft: 4, opacity: 0.55,
                      fontSize: isMobile ? '0.62rem' : '0.68rem',
                      fontWeight: 600,
                    }}>
                      · {p.grams}{cfg.displayUnit === 'ml' ? 'ml' : 'g'}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )
      })()}

      {/* Maaltijd */}
      <Row label="Maaltijd">
        <div style={{ position: 'relative' }}>
          <DropdownBtn
            label={currentMealLabel}
            onClick={() => setShowMealDropdown(!showMealDropdown)}
            active={showMealDropdown}
          />
          {showMealDropdown && (
            <DropdownMenu
              options={MEAL_MOMENTS}
              selected={mealMoment}
              onSelect={(opt) => { setMealMoment(opt.id); setShowMealDropdown(false) }}
              onClose={() => setShowMealDropdown(false)}
            />
          )}
        </div>
      </Row>

      {/* Macro donut */}
      <div style={{
        padding: isMobile ? '1.25rem 1rem' : '1.5rem',
        display: 'flex', alignItems: 'center', gap: isMobile ? '1.25rem' : '1.5rem'
      }}>
        <div style={{ position: 'relative', width: '80px', height: '80px', flexShrink: 0 }}>
          <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
            <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3.5" />
            <circle cx="18" cy="18" r="14" fill="none" stroke="#FFD700" strokeWidth="3.5"
              strokeDasharray={`${protPct * 0.88} 88`} strokeDashoffset="0" strokeLinecap="round" />
            <circle cx="18" cy="18" r="14" fill="none" stroke="#f59e0b" strokeWidth="3.5"
              strokeDasharray={`${carbPct * 0.88} 88`} strokeDashoffset={`${-protPct * 0.88}`} strokeLinecap="round" />
            <circle cx="18" cy="18" r="14" fill="none" stroke="#8b5cf6" strokeWidth="3.5"
              strokeDasharray={`${fatPct * 0.88} 88`} strokeDashoffset={`${-(protPct + carbPct) * 0.88}`} strokeLinecap="round" />
          </svg>
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center'
          }}>
            <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#fff', lineHeight: 1 }}>{macros.calories}</div>
            <div style={{ fontSize: '0.4rem', fontWeight: '600', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>cal</div>
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between' }}>
          {[
            { label: 'Koolhydr', value: macros.carbs, pct: carbPct, color: '#f59e0b' },
            { label: 'Vetten', value: macros.fat, pct: fatPct, color: '#8b5cf6' },
            { label: 'Eiwitten', value: macros.protein, pct: protPct, color: '#FFD700' }
          ].map(m => (
            <div key={m.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.6rem', fontWeight: '700', color: m.color, marginBottom: '0.15rem' }}>{m.pct} %</div>
              <div style={{ fontSize: isMobile ? '0.95rem' : '1.05rem', fontWeight: '800', color: '#fff' }}>{m.value} g</div>
              <div style={{ fontSize: '0.5rem', fontWeight: '600', color: m.color, marginTop: '0.1rem' }}>{m.label}</div>
            </div>
          ))}
        </div>
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
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            {item.ingredients.map((ing, i) => {
              const nm = ing.name || ing.ingredient_name || 'Ingrediënt'
              const baseAmt = Number(ing.amount) || 0
              const scaled = baseAmt > 0 ? Math.round(baseAmt * (factor || 1)) : 0
              const unit = ing.unit || 'g'
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '0.55rem',
                  padding: '0.35rem 0'
                }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: 7, flexShrink: 0, overflow: 'hidden',
                    background: 'rgba(255,255,255,0.05)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center'
                  }}>
                    {ing.image_url
                      ? <img src={ing.image_url} alt={nm} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.currentTarget.style.display = 'none' }} />
                      : <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'rgba(255,215,0,0.6)' }}>{nm.charAt(0).toUpperCase()}</span>}
                  </div>
                  <span style={{
                    flex: 1, minWidth: 0, fontSize: isMobile ? '0.82rem' : '0.88rem',
                    fontWeight: 600, color: 'rgba(255,255,255,0.8)',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                  }}>{nm}</span>
                  {scaled > 0 && (
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', flexShrink: 0 }}>
                      {scaled}{unit === 'gram' ? 'g' : ` ${unit}`}
                    </span>
                  )}
                </div>
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
          background: saving ? 'rgba(255, 215, 0, 0.05)' : 'rgba(255, 215, 0, 0.12)',
          border: '1px solid rgba(255, 215, 0, 0.3)',
          borderRadius: isMobile ? '10px' : '12px',
          color: '#FFD700', fontSize: isMobile ? '0.85rem' : '0.95rem',
          fontWeight: '800', cursor: saving ? 'wait' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: '0.5rem', minHeight: '48px',
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          opacity: (saving || macros.calories === 0) ? 0.5 : 1
        }}
          onTouchStart={(e) => { if (isMobile && !saving) e.currentTarget.style.transform = 'scale(0.98)' }}
          onTouchEnd={(e) => { if (isMobile) e.currentTarget.style.transform = 'scale(1)' }}
        >
          <Check size={16} strokeWidth={2.5} />
          {saving ? 'Opslaan...' : 'Registreer'}
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
