// src/modules/meal-plan/components/food-log/QuickAddTab.jsx
// 🎯 Snel toevoegen — direct macros invoeren zonder zoeken
// + Product-lookup: while typing the name, find a matching product in
//   ai_ingredients and surface its image so the log gets a thumbnail.
import React, { useEffect, useState } from 'react'
import { Check, X, ImageOff } from 'lucide-react'

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

// ⚠️ Defined OUTSIDE the component on purpose — defining it inside causes
// React to remount the <input> on every keystroke (because Row is a new
// reference each render), which kills focus and dismisses the mobile keyboard.
const Row = ({ label, value, onChange, placeholder, autoFocus, isMobile }) => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: isMobile ? '0.75rem 1rem' : '0.875rem 1.5rem',
    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
    minHeight: '48px'
  }}>
    <div style={{
      fontSize: isMobile ? '0.85rem' : '0.9rem',
      fontWeight: '500', color: 'rgba(255, 255, 255, 0.6)'
    }}>
      {label}
    </div>
    <input
      type={label === 'Naam' ? 'text' : 'number'}
      inputMode={label === 'Naam' ? 'text' : 'numeric'}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={(e) => { if (label !== 'Naam') e.target.select() }}
      placeholder={placeholder}
      autoFocus={autoFocus}
      style={{
        width: label === 'Naam' ? '180px' : '80px',
        padding: '0.5rem',
        background: 'transparent',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '8px',
        color: '#fff',
        fontSize: isMobile ? '0.9rem' : '0.95rem',
        fontWeight: '600',
        textAlign: label === 'Naam' ? 'left' : 'right',
        outline: 'none',
        minHeight: '36px'
      }}
    />
  </div>
)

export default function QuickAddTab({ onLog, isMobile, db }) {
  const [name, setName] = useState('')
  const [calories, setCalories] = useState('')
  const [protein, setProtein] = useState('')
  const [carbs, setCarbs] = useState('')
  const [fat, setFat] = useState('')
  const [mealMoment, setMealMoment] = useState(getDefaultMoment())
  const [saving, setSaving] = useState(false)

  // Product-lookup: matched ai_ingredient (with image) for the typed name.
  // The user can dismiss the match (then it logs without image).
  const [matchedProduct, setMatchedProduct] = useState(null)
  const [matchDismissed, setMatchDismissed] = useState(false)

  // Debounced lookup — only fires while the user pauses typing.
  // Searches ai_meals (curated, lots of images) first, then ai_ingredients
  // (popular ones), then community-shared consumed_meals as a final fallback.
  useEffect(() => {
    const trimmed = name.trim()
    if (matchDismissed || trimmed.length < 2 || !db?.supabase) {
      setMatchedProduct(null)
      return
    }
    let cancelled = false
    const timer = setTimeout(async () => {
      const safe = trimmed.replace(/[%,()*."'\\]/g, ' ').trim()
      if (!safe) return
      try {
        const [mealsRes, ingredientsRes, sharedRes] = await Promise.all([
          db.supabase
            .from('ai_meals')
            .select('id, name, image_url')
            .ilike('name', `%${safe}%`)
            .not('image_url', 'is', null)
            .limit(1),
          db.supabase
            .from('ai_ingredients')
            .select('id, name, brand, image_url')
            .ilike('name', `%${safe}%`)
            .not('image_url', 'is', null)
            .order('log_count', { ascending: false })
            .limit(1),
          db.supabase
            .from('consumed_meals')
            .select('meal_id, meal_name, image_url')
            .ilike('meal_name', `%${safe}%`)
            .not('image_url', 'is', null)
            .eq('is_shared', true)
            .order('log_count', { ascending: false })
            .limit(1),
        ])
        if (cancelled) return
        const mealHit = mealsRes?.data?.[0]
        const ingHit  = ingredientsRes?.data?.[0]
        const sharedHit = sharedRes?.data?.[0]
        let match = null
        if (mealHit) {
          match = { id: mealHit.id, name: mealHit.name, brand: null, image_url: mealHit.image_url }
        } else if (ingHit) {
          match = { id: ingHit.id, name: ingHit.name, brand: ingHit.brand, image_url: ingHit.image_url }
        } else if (sharedHit) {
          match = { id: sharedHit.meal_id || null, name: sharedHit.meal_name, brand: null, image_url: sharedHit.image_url }
        }
        setMatchedProduct(match)
      } catch {
        if (!cancelled) setMatchedProduct(null)
      }
    }, 300)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [name, matchDismissed, db])

  // Reset dismiss flag when user clears or rewrites the name.
  useEffect(() => {
    if (name.trim().length === 0) setMatchDismissed(false)
  }, [name])

  const cal = parseInt(calories) || 0
  const canSave = cal > 0 || (parseInt(protein) || 0) > 0

  const handleLog = async () => {
    if (!canSave) return
    setSaving(true)
    try {
      await onLog({
        name: name.trim() || matchedProduct?.name || 'Snel toevoegen',
        calories: parseInt(calories) || 0,
        protein: parseInt(protein) || 0,
        carbs: parseInt(carbs) || 0,
        fat: parseInt(fat) || 0,
        type: 'quick_add',
        source: 'quick_add',
        meal_type: mealMoment,
        per100g: false,
        // ✅ Pass the matched product's image + id so the log has a thumbnail
        // and Recent can show it back.
        image_url: matchedProduct?.image_url || null,
        sourceId: matchedProduct?.id || null,
        brand: matchedProduct?.brand || null,
      })
    } catch {
      setSaving(false)
    }
  }

  const currentMealLabel = MEAL_MOMENTS.find(m => m.id === mealMoment)?.label

  return (
    <div>
      {/* Naam */}
      <Row label="Naam" value={name} onChange={setName} placeholder="Optioneel" isMobile={isMobile} />

      {/* Matched product preview — auto-found while typing */}
      {matchedProduct && (
        <div style={{
          display: 'flex', alignItems: 'center',
          gap: '0.625rem',
          padding: isMobile ? '0.625rem 1rem' : '0.75rem 1.5rem',
          background: 'rgba(255, 215, 0, 0.05)',
          borderBottom: '1px solid rgba(255, 215, 0, 0.15)',
          minHeight: '52px',
        }}>
          {matchedProduct.image_url ? (
            <div
              style={{
                width: '36px', height: '36px',
                borderRadius: '8px',
                background: `url(${matchedProduct.image_url}) center/cover`,
                border: '1px solid rgba(255, 215, 0, 0.25)',
                flexShrink: 0,
              }}
            />
          ) : (
            <div style={{
              width: '36px', height: '36px',
              borderRadius: '8px',
              background: 'rgba(255, 215, 0, 0.06)',
              border: '1px solid rgba(255, 215, 0, 0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'rgba(255, 215, 0, 0.4)',
              flexShrink: 0,
            }}>
              <ImageOff size={14} />
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: isMobile ? '0.5rem' : '0.55rem',
              fontWeight: '800', color: 'rgba(255, 215, 0, 0.7)',
              textTransform: 'uppercase', letterSpacing: '0.06em',
              lineHeight: 1, marginBottom: '0.2rem',
            }}>
              Product gevonden
            </div>
            <div style={{
              fontSize: isMobile ? '0.78rem' : '0.85rem',
              fontWeight: '700', color: '#fff',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              lineHeight: 1.2,
            }}>
              {matchedProduct.name}
              {matchedProduct.brand && (
                <span style={{ color: 'rgba(255, 255, 255, 0.4)', fontWeight: 500 }}>
                  {' · '}{matchedProduct.brand}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => { setMatchedProduct(null); setMatchDismissed(true) }}
            aria-label="Wis product-koppeling"
            title="Verwijder product-koppeling"
            style={{
              width: '30px', height: '30px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'transparent',
              border: 'none', borderRadius: '6px',
              color: 'rgba(255, 255, 255, 0.4)',
              cursor: 'pointer',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              flexShrink: 0,
            }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Macros */}
      <Row label="Calorieën"        value={calories} onChange={setCalories} placeholder="0" isMobile={isMobile} />
      <Row label="Eiwit (g)"        value={protein}  onChange={setProtein}  placeholder="0" isMobile={isMobile} />
      <Row label="Koolhydraten (g)" value={carbs}    onChange={setCarbs}    placeholder="0" isMobile={isMobile} />
      <Row label="Vetten (g)"       value={fat}      onChange={setFat}      placeholder="0" isMobile={isMobile} />

      {/* Maaltijd */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: isMobile ? '0.75rem 1rem' : '0.875rem 1.5rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        minHeight: '48px'
      }}>
        <div style={{
          fontSize: isMobile ? '0.85rem' : '0.9rem',
          fontWeight: '500', color: 'rgba(255, 255, 255, 0.6)'
        }}>
          Maaltijd
        </div>
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          {MEAL_MOMENTS.map(m => (
            <button
              key={m.id}
              onClick={() => setMealMoment(m.id)}
              style={{
                padding: isMobile ? '0.35rem 0.5rem' : '0.4rem 0.625rem',
                background: mealMoment === m.id ? 'rgba(255, 215, 0, 0.1)' : 'transparent',
                border: mealMoment === m.id
                  ? '1px solid rgba(255, 215, 0, 0.25)'
                  : '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '6px',
                color: mealMoment === m.id ? '#FFD700' : 'rgba(255, 255, 255, 0.3)',
                fontSize: isMobile ? '0.55rem' : '0.6rem',
                fontWeight: mealMoment === m.id ? '700' : '500',
                cursor: 'pointer', minHeight: '28px',
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent'
              }}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Registreer */}
      <div style={{
        padding: isMobile ? '1rem' : '1.25rem 1.5rem'
      }}>
        <button
          onClick={handleLog}
          disabled={saving || !canSave}
          style={{
            width: '100%', padding: isMobile ? '0.875rem' : '1rem',
            background: (saving || !canSave) ? 'rgba(255, 215, 0, 0.05)' : 'rgba(255, 215, 0, 0.12)',
            border: '1px solid rgba(255, 215, 0, 0.3)',
            borderRadius: isMobile ? '10px' : '12px',
            color: '#FFD700',
            fontSize: isMobile ? '0.85rem' : '0.95rem',
            fontWeight: '800', cursor: (saving || !canSave) ? 'default' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: '0.5rem', minHeight: '48px',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            opacity: (saving || !canSave) ? 0.4 : 1
          }}
        >
          <Check size={16} strokeWidth={2.5} />
          {saving ? 'Opslaan...' : `Registreer${cal > 0 ? ` — ${cal} kcal` : ''}`}
        </button>
      </div>
    </div>
  )
}
