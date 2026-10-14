// src/modules/meal-plan/components/food-log/QuickAddTab.jsx
// 🎯 Snel toevoegen — direct macros invoeren zonder zoeken
// + Product-lookup: while typing the name, find a matching product in
//   ai_ingredients and surface its image so the log gets a thumbnail.
import React, { useEffect, useState } from 'react'
import { Check, X, ImageOff } from 'lucide-react'

const MEAL_MOMENTS = [
  { id: 'breakfast', label: 'Ontbijt' },
  { id: 'lunch', label: 'Lunch' },
  { id: 'dinner', label: 'Diner' },
  { id: 'snack', label: 'Snack' }
]

const getDefaultMoment = () => {
  const hour = new Date().getHours()
  if (hour < 11) return 'breakfast'
  if (hour < 15) return 'lunch'
  if (hour < 20) return 'dinner'
  return 'snack'
}

// ⚠️ Buiten het component gedefinieerd: binnenin zou React het <input> bij
// elke toetsaanslag opnieuw opbouwen, waardoor de focus en het toetsenbord
// op mobiel wegvallen.
const Veld = ({ label, kleur, value, onChange, placeholder, eenheid, groot = false }) => (
  <label style={{
    flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4,
    padding: groot ? '0.8rem 0.9rem' : '0.6rem 0.7rem',
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 12, cursor: 'text',
  }}>
    <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.68rem', fontWeight: 800, color: 'rgba(255,255,255,0.55)' }}>
      {kleur && <span style={{ width: 7, height: 7, borderRadius: 999, background: kleur, flexShrink: 0 }} />}
      {label}
    </span>
    <span style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
      <input
        type="number" inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={(e) => e.target.select()}
        placeholder={placeholder}
        style={{
          width: '100%', minWidth: 0, background: 'transparent', border: 'none', outline: 'none', padding: 0,
          color: '#fff', fontFamily: 'inherit', fontWeight: 900, letterSpacing: '-0.02em',
          fontSize: groot ? '1.9rem' : '1.2rem',
        }}
      />
      <span style={{ fontSize: groot ? '0.85rem' : '0.75rem', fontWeight: 800, color: 'rgba(255,255,255,0.45)' }}>{eenheid}</span>
    </span>
  </label>
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

  // Geen kcal ingevuld maar wel macro's? Dan rekenen we ze uit (4/4/9).
  const p = parseFloat(protein) || 0, k = parseFloat(carbs) || 0, v = parseFloat(fat) || 0
  const berekend = Math.round(p * 4 + k * 4 + v * 9)
  const cal = parseInt(calories) || berekend
  const kcalBerekend = !(parseInt(calories) > 0) && berekend > 0
  const canSave = cal > 0 || p > 0

  const handleLog = async () => {
    if (!canSave) return
    setSaving(true)
    try {
      await onLog({
        name: name.trim() || matchedProduct?.name || 'Snel toevoegen',
        calories: cal,
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

  const pad = isMobile ? '0 1rem' : '0 1.25rem'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: `0.25rem 0 1.25rem` }}>
      {/* Naam */}
      <div style={{ padding: pad }}>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Wat heb je gegeten? (optioneel)"
          style={{
            width: '100%', boxSizing: 'border-box', minHeight: 48, padding: '0 0.9rem',
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12, color: '#fff', fontSize: '0.92rem', fontWeight: 800,
            fontFamily: 'inherit', outline: 'none',
          }}
        />
      </div>

      {/* Gevonden product: alleen voor de foto bij de log. */}
      {matchedProduct && (
        <div style={{ padding: pad }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.65rem',
            padding: '0.5rem 0.6rem', borderRadius: 12,
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
          }}>
            {matchedProduct.image_url ? (
              <div style={{ width: 38, height: 38, borderRadius: 9, background: `url(${matchedProduct.image_url}) center/cover`, flexShrink: 0 }} />
            ) : (
              <div style={{ width: 38, height: 38, borderRadius: 9, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.35)', flexShrink: 0 }}>
                <ImageOff size={15} />
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.62rem', fontWeight: 800, color: 'rgba(255,255,255,0.45)' }}>Foto van</div>
              <div style={{ fontSize: '0.84rem', fontWeight: 900, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {matchedProduct.name}
                {matchedProduct.brand && <span style={{ color: 'rgba(255,255,255,0.45)', fontWeight: 700 }}>{' · '}{matchedProduct.brand}</span>}
              </div>
            </div>
            <button
              onClick={() => { setMatchedProduct(null); setMatchDismissed(true) }}
              aria-label="Wis product-koppeling"
              style={{
                width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', flexShrink: 0,
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              }}
            >
              <X size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Calorieën groot, macro's eronder in drie vakken. */}
      <div style={{ padding: pad }}>
        <Veld
          groot label="Calorieën" eenheid="kcal"
          value={calories} onChange={setCalories}
          placeholder={kcalBerekend ? String(berekend) : '0'}
        />
        {kcalBerekend && (
          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginTop: 5 }}>
            {berekend} kcal berekend uit je macro's
          </div>
        )}
      </div>
      <div style={{ padding: pad, display: 'flex', gap: 8 }}>
        <Veld label="Eiwit" kleur="#3b82f6" eenheid="g" value={protein} onChange={setProtein} placeholder="0" />
        <Veld label="Koolh" kleur="#ec4899" eenheid="g" value={carbs} onChange={setCarbs} placeholder="0" />
        <Veld label="Vet" kleur="#f59e0b" eenheid="g" value={fat} onChange={setFat} placeholder="0" />
      </div>

      {/* Moment */}
      <div style={{ padding: pad }}>
        <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'rgba(255,255,255,0.55)', marginBottom: 6 }}>Moment</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
          {MEAL_MOMENTS.map(m => {
            const aan = mealMoment === m.id
            return (
              <button
                key={m.id}
                onClick={() => setMealMoment(m.id)}
                style={{
                  minHeight: 38, padding: '0 0.2rem', borderRadius: 10,
                  background: aan ? '#fff' : 'transparent',
                  border: `1px solid ${aan ? '#fff' : 'rgba(255,255,255,0.14)'}`,
                  color: aan ? '#0a0a0a' : 'rgba(255,255,255,0.65)',
                  fontSize: '0.74rem', fontWeight: aan ? 900 : 800, fontFamily: 'inherit',
                  cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                }}
              >
                {m.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Loggen */}
      <div style={{ padding: pad, marginTop: 4 }}>
        <button
          onClick={handleLog}
          disabled={saving || !canSave}
          style={{
            width: '100%', minHeight: 52, borderRadius: 14, border: 'none',
            background: canSave ? '#fff' : 'rgba(255,255,255,0.1)',
            color: canSave ? '#0a0a0a' : 'rgba(255,255,255,0.35)',
            fontSize: '0.95rem', fontWeight: 900, fontFamily: 'inherit',
            cursor: (saving || !canSave) ? 'default' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          }}
        >
          <Check size={17} strokeWidth={3} />
          {saving ? 'Opslaan…' : `Loggen${cal > 0 ? ` · ${cal} kcal` : ''}`}
        </button>
      </div>
    </div>
  )
}
