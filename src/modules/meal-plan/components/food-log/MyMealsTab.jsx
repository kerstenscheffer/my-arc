// src/modules/meal-plan/components/food-log/MyMealsTab.jsx
// 🎯 v3.0 - Uses parent buildingMeal state to survive tab switches
import React, { useState, useEffect } from 'react'
import { Plus, Trash2, Check, ArrowLeft, ChevronRight, ChevronDown, Camera, Image as ImageIcon, X, Calculator } from 'lucide-react'
import MealPrepCalculator from '../MealPrepCalculator'

const MEAL_MOMENTS = [
  { id: 'breakfast', label: 'Ontbijt' },
  { id: 'lunch', label: 'Lunch' },
  { id: 'dinner', label: 'Avondeten' },
  { id: 'snack', label: 'Tussendoortjes' }
]

// Vaste secties waarin de klant z'n eigen maaltijden indeelt. Vast door ons
// bepaald; `moment` is het bijhorende log-moment, `emoji` de card-icoon-fallback.
const SECTIONS = [
  { id: 'ontbijt',     label: 'Mijn ontbijt',     moment: 'breakfast', emoji: '🌅', color: '#f59e0b' },
  { id: 'lunch',       label: 'Mijn lunch',       moment: 'lunch',     emoji: '🥗', color: '#10b981' },
  { id: 'pre_workout', label: 'Mijn pre-workout', moment: 'snack',     emoji: '⚡', color: '#3b82f6' },
  { id: 'snacks',      label: 'Mijn snacks',      moment: 'snack',     emoji: '🍎', color: '#ec4899' },
  { id: 'diner',       label: 'Mijn diner',       moment: 'dinner',    emoji: '🍽️', color: '#8b5cf6' },
]
const SECTION_MOMENT = Object.fromEntries(SECTIONS.map(s => [s.id, s.moment]))

export default function MyMealsTab({ client, db, onLog, onRequestAddIngredient, buildingMeal, setBuildingMeal, isMobile }) {
  const [myMeals, setMyMeals] = useState([])
  const [loading, setLoading] = useState(true)
  const [showPrep, setShowPrep] = useState(false)
  const [openSection, setOpenSection] = useState(null) // welke sectie is uitgeklapt

  useEffect(() => {
    if (client?.id) loadMyMeals()
  }, [client?.id])

  const loadMyMeals = async () => {
    setLoading(true)
    try {
      const { data, error } = await db.supabase
        .from('ai_custom_meals')
        .select('*')
        .eq('client_id', client.id)
        .eq('is_active', true)
        .order('updated_at', { ascending: false })
      if (error) throw error
      setMyMeals(data || [])
    } catch { setMyMeals([]) }
    finally { setLoading(false) }
  }

  const handleQuickLog = (meal) => {
    onLog({
      name: meal.name, sourceId: meal.id, type: 'custom_meal',
      calories: meal.calories || 0, protein: parseFloat(meal.protein) || 0,
      carbs: parseFloat(meal.carbs) || 0, fat: parseFloat(meal.fat) || 0,
      ingredients: meal.ingredients_list || [], source: 'my_meals',
      meal_type: SECTION_MOMENT[meal.section] || 'snack', per100g: false,
      image_url: meal.image_url || null
    })
  }

  // Nieuwe maaltijd — optioneel voor een vaste sectie (dan onthoudt 'ie de sectie
  // + het bijbehorende log-moment).
  const handleCreateNew = (sectionId = null) => {
    setBuildingMeal({
      id: null, name: '', ingredients_list: [],
      calories: 0, protein: 0, carbs: 0, fat: 0,
      section: sectionId, _moment: sectionId ? SECTION_MOMENT[sectionId] : null,
    })
  }

  const handleOpenMeal = (meal) => {
    setBuildingMeal({ ...meal, ingredients_list: meal.ingredients_list || [] })
  }

  // Maaltijden gegroepeerd per sectie (null/onbekend → 'overige').
  const mealsBySection = {}
  SECTIONS.forEach(s => { mealsBySection[s.id] = [] })
  mealsBySection.overige = []
  myMeals.forEach(m => {
    const sid = mealsBySection[m.section] !== undefined ? m.section : 'overige'
    mealsBySection[sid].push(m)
  })

  // ═══ DETAIL VIEW (building/editing a meal) ═══
  if (buildingMeal) {
    return (
      <MealDetailView
        meal={buildingMeal}
        setMeal={setBuildingMeal}
        client={client}
        db={db}
        isMobile={isMobile}
        onBack={() => { setBuildingMeal(null); loadMyMeals() }}
        onRequestAddIngredient={onRequestAddIngredient}
        onLog={onLog}
      />
    )
  }

  // ═══ LIST VIEW ═══
  if (loading) {
    return <div style={{ padding: '3rem', textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '0.8rem' }}>Laden...</div>
  }

  return (
    <div>
      <button
        onClick={handleCreateNew}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: '0.375rem', width: '100%',
          padding: isMobile ? '0.875rem 1rem' : '1rem 1.5rem',
          background: 'rgba(255, 215, 0, 0.04)', border: 'none',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          color: '#FFD700', fontSize: isMobile ? '0.8rem' : '0.85rem',
          fontWeight: '700', cursor: 'pointer',
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minHeight: '48px'
        }}
      >
        <Plus size={16} strokeWidth={2.5} />
        Maaltijd aanmaken
      </button>

      {/* Meal-prep calculator — reken je bakjes uit en sla ze hier op. */}
      <button
        onClick={() => setShowPrep(true)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: '0.375rem', width: '100%',
          padding: isMobile ? '0.875rem 1rem' : '1rem 1.5rem',
          background: 'rgba(255, 215, 0, 0.04)', border: 'none',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          color: '#FFD700', fontSize: isMobile ? '0.8rem' : '0.85rem',
          fontWeight: '700', cursor: 'pointer',
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minHeight: '48px'
        }}
      >
        <Calculator size={16} strokeWidth={2.5} />
        Meal-prep calculator
      </button>

      {showPrep && (
        <MealPrepCalculator
          client={client}
          db={db}
          onClose={() => setShowPrep(false)}
          onSaved={() => loadMyMeals()}
        />
      )}

      {/* ── Vaste secties: elke sectie een card (foto/emoji + titel), links een
             uitklap-pijl om de meals te zien, rechts een "+" om een meal voor
             deze sectie aan te maken. Meals zonder sectie vallen in "Overige". ── */}
      {SECTIONS.concat(
        mealsBySection.overige.length
          ? [{ id: 'overige', label: 'Overige', moment: 'snack', emoji: '📦', color: 'rgba(255,255,255,0.4)' }]
          : []
      ).map(sec => {
        const meals = mealsBySection[sec.id] || []
        const open = openSection === sec.id
        const thumb = meals.find(m => m.image_url)?.image_url || null
        return (
          <div key={sec.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            {/* Sectie-card */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <button
                onClick={() => setOpenSection(open ? null : sec.id)}
                style={{
                  flex: 1, minWidth: 0, display: 'flex', alignItems: 'center',
                  padding: isMobile ? '0.75rem 1rem' : '0.875rem 1.25rem',
                  background: open ? 'rgba(255,255,255,0.02)' : 'transparent', border: 'none', cursor: 'pointer',
                  textAlign: 'left', touchAction: 'manipulation', minHeight: '64px', gap: '0.75rem'
                }}
              >
                {/* Uitklap-pijl links */}
                <ChevronDown size={16} color="rgba(255,255,255,0.4)"
                  style={{ flexShrink: 0, transform: open ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s ease' }} />
                {/* Thumbnail: eerste meal-foto in de sectie, anders emoji */}
                {thumb ? (
                  <div style={{ width: '48px', height: '48px', borderRadius: '10px', flexShrink: 0, background: `url(${thumb}) center/cover, #fff`, border: '1px solid rgba(255,255,255,0.08)' }} />
                ) : (
                  <div style={{ width: '48px', height: '48px', borderRadius: '10px', flexShrink: 0, background: `${sec.color}14`, border: `1px solid ${sec.color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>
                    {sec.emoji}
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: isMobile ? '0.9rem' : '0.95rem', fontWeight: '800', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {sec.label}
                  </div>
                  <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.35)', marginTop: '0.2rem' }}>
                    {meals.length} maaltijd{meals.length !== 1 ? 'en' : ''}
                  </div>
                </div>
              </button>
              {/* "+" rechts — nieuwe meal voor deze sectie */}
              {sec.id !== 'overige' && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleCreateNew(sec.id) }}
                  aria-label={`Maaltijd toevoegen aan ${sec.label}`}
                  style={{
                    width: '48px', minHeight: '56px', flexShrink: 0,
                    background: 'transparent', border: 'none',
                    borderLeft: '1px solid rgba(255,255,255,0.04)',
                    color: '#FFD700', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    touchAction: 'manipulation'
                  }}
                >
                  <Plus size={18} strokeWidth={2.5} />
                </button>
              )}
            </div>

            {/* Uitgeklapte meals van deze sectie */}
            {open && (
              meals.length === 0 ? (
                <div style={{ padding: '1rem 1.25rem 1.25rem calc(1.25rem + 16px + 0.75rem)', fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)' }}>
                  Nog geen maaltijden hier — tik op <Plus size={11} style={{ display: 'inline', verticalAlign: 'middle' }} /> om er een aan te maken.
                </div>
              ) : (
                meals.map((meal, idx) => (
                  <div key={meal.id} style={{
                    display: 'flex', alignItems: 'center',
                    background: 'rgba(255,255,255,0.015)',
                    borderTop: idx === 0 ? '1px solid rgba(255,255,255,0.03)' : 'none',
                    borderBottom: idx < meals.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none'
                  }}>
                    <button
                      onClick={() => handleOpenMeal(meal)}
                      style={{
                        flex: 1, minWidth: 0, display: 'flex', alignItems: 'center',
                        padding: isMobile ? '0.65rem 1rem 0.65rem 2.5rem' : '0.75rem 1.25rem 0.75rem 3rem',
                        background: 'transparent', border: 'none', cursor: 'pointer',
                        textAlign: 'left', touchAction: 'manipulation', minHeight: '56px', gap: '0.75rem'
                      }}
                    >
                      {meal.image_url ? (
                        <div style={{ width: '40px', height: '40px', borderRadius: '9px', flexShrink: 0, background: `url(${meal.image_url}) center/cover, #fff`, border: '1px solid rgba(255,255,255,0.08)' }} />
                      ) : (
                        <div style={{ width: '40px', height: '40px', borderRadius: '9px', flexShrink: 0, background: 'rgba(255, 215, 0, 0.06)', border: '1px solid rgba(255, 215, 0, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255, 215, 0, 0.5)' }}>
                          <ImageIcon size={18} strokeWidth={1.8} />
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: isMobile ? '0.82rem' : '0.88rem', fontWeight: '700', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {meal.name}
                        </div>
                        <div style={{ display: 'flex', gap: '0.375rem', marginTop: '0.15rem' }}>
                          <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.35)' }}>
                            <span style={{ fontWeight: '800', color: 'rgba(255,255,255,0.5)' }}>{meal.calories || 0}</span> kcal
                          </span>
                          {Array.isArray(meal.ingredients_list) && (
                            <span style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.2)' }}>
                              • {meal.ingredients_list.length} item{meal.ingredients_list.length !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight size={14} color="rgba(255,255,255,0.15)" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleQuickLog(meal) }}
                      aria-label="Loggen"
                      style={{
                        width: '48px', minHeight: '52px', flexShrink: 0,
                        background: 'transparent', border: 'none',
                        borderLeft: '1px solid rgba(255,255,255,0.04)',
                        color: '#FFD700', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        touchAction: 'manipulation'
                      }}
                    >
                      <Plus size={16} strokeWidth={2.5} />
                    </button>
                  </div>
                ))
              )
            )}
          </div>
        )
      })}
    </div>
  )
}

// ═══════════════════════════════════════════
// MEAL DETAIL VIEW
// ═══════════════════════════════════════════

function MealDetailView({ meal, setMeal, client, db, isMobile, onBack, onRequestAddIngredient, onLog }) {
  const [saving, setSaving] = useState(false)
  const [showMealDropdown, setShowMealDropdown] = useState(false)
  // Log-moment: standaard uit de gekozen sectie (bv. pre-workout → snack).
  const [mealMoment, setMealMoment] = useState(meal._moment || SECTION_MOMENT[meal.section] || 'breakfast')
  // Photo state — `photoFile` is a File from the picker (upload pending),
  // `photoPreview` is what's shown in the UI (object URL or saved image_url).
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(meal.image_url || null)
  const [photoUploading, setPhotoUploading] = useState(false)

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const handlePhotoRemove = () => {
    setPhotoFile(null)
    setPhotoPreview(null)
    // Mark image_url as cleared so save() knows to null it in DB
    setMeal({ ...meal, image_url: null })
  }

  const uploadMealPhoto = async (file) => {
    if (!file) return null
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
    const fileName = `${client.id}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`
    const { error } = await db.supabase.storage
      .from('meal-photos')
      .upload(fileName, file, { contentType: file.type || 'image/jpeg', upsert: false })
    if (error) throw error
    const { data: { publicUrl } } = db.supabase.storage.from('meal-photos').getPublicUrl(fileName)
    return publicUrl
  }

  const totals = (meal.ingredients_list || []).reduce((t, ing) => ({
    calories: t.calories + (ing.calories || 0),
    protein: t.protein + (parseFloat(ing.protein) || 0),
    carbs: t.carbs + (parseFloat(ing.carbs) || 0),
    fat: t.fat + (parseFloat(ing.fat) || 0)
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 })

  const totalG = totals.protein + totals.carbs + totals.fat
  const protPct = totalG > 0 ? Math.round((totals.protein / totalG) * 100) : 0
  const carbPct = totalG > 0 ? Math.round((totals.carbs / totalG) * 100) : 0
  const fatPct = totalG > 0 ? 100 - protPct - carbPct : 0

  const handleRemove = (index) => {
    const updated = [...meal.ingredients_list]
    updated.splice(index, 1)
    setMeal({ ...meal, ingredients_list: updated })
  }

  // Upload pending photo (if any) and return the URL to persist.
  // Falls back to existing meal.image_url when nothing changed; returns null
  // when the user explicitly removed the photo.
  const resolveImageUrl = async () => {
    if (photoFile) {
      setPhotoUploading(true)
      try { return await uploadMealPhoto(photoFile) }
      finally { setPhotoUploading(false) }
    }
    return photoPreview ? (meal.image_url || photoPreview) : null
  }

  const handleSave = async () => {
    if (!meal.name?.trim() || !meal.ingredients_list?.length) return
    setSaving(true)
    try {
      const imageUrl = await resolveImageUrl()
      const mealData = {
        client_id: client.id, name: meal.name.trim(),
        calories: Math.round(totals.calories), protein: Math.round(totals.protein),
        carbs: Math.round(totals.carbs), fat: Math.round(totals.fat),
        ingredients_list: meal.ingredients_list, is_active: true,
        image_url: imageUrl,
        section: meal.section || null,
        updated_at: new Date().toISOString()
      }
      if (meal.id) {
        await db.supabase.from('ai_custom_meals').update(mealData).eq('id', meal.id)
      } else {
        await db.supabase.from('ai_custom_meals').insert(mealData)
      }
      onBack()
    } catch (err) {
      console.error('Save failed:', err)
      alert('Opslaan mislukt.')
      setSaving(false)
    }
  }

  const handleLogMeal = async () => {
    // First save to ai_custom_meals, then log to consumed_meals
    setSaving(true)
    let imageUrl = null
    try {
      imageUrl = await resolveImageUrl()
      const mealData = {
        client_id: client.id, name: meal.name.trim() || 'Mijn maaltijd',
        calories: Math.round(totals.calories), protein: Math.round(totals.protein),
        carbs: Math.round(totals.carbs), fat: Math.round(totals.fat),
        ingredients_list: meal.ingredients_list, is_active: true,
        image_url: imageUrl,
        section: meal.section || null,
        updated_at: new Date().toISOString()
      }
      if (meal.id) {
        await db.supabase.from('ai_custom_meals').update(mealData).eq('id', meal.id)
      } else {
        await db.supabase.from('ai_custom_meals').insert(mealData)
      }
      console.log('✅ Meal saved to ai_custom_meals')
    } catch (err) {
      console.warn('⚠️ Could not save to custom meals:', err)
    }

    // Then log
    onLog({
      name: meal.name || 'Mijn maaltijd', type: 'custom_meal',
      calories: Math.round(totals.calories), protein: Math.round(totals.protein),
      carbs: Math.round(totals.carbs), fat: Math.round(totals.fat),
      ingredients: meal.ingredients_list || [], source: 'my_meals',
      meal_type: mealMoment, per100g: false,
      image_url: imageUrl
    })
    setSaving(false)
  }

  const currentMealLabel = MEAL_MOMENTS.find(m => m.id === mealMoment)?.label || 'Ontbijt'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: isMobile ? '0.625rem 0.75rem' : '0.75rem 1.25rem',
        borderBottom: '1px solid rgba(255,255,255,0.06)'
      }}>
        <button onClick={onBack} style={{
          background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)',
          cursor: 'pointer', padding: '0.25rem', touchAction: 'manipulation',
          display: 'flex', alignItems: 'center', gap: '0.25rem',
          fontSize: '0.75rem', fontWeight: '600'
        }}>
          <ArrowLeft size={16} /> Terug
        </button>
        <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#fff' }}>
          {meal.id ? 'Maaltijd bewerken' : 'Maaltijd aanmaken'}
        </div>
        <button onClick={handleSave}
          disabled={saving || !meal.name?.trim() || !meal.ingredients_list?.length}
          style={{
            background: 'none', border: 'none',
            color: (saving || !meal.name?.trim() || !meal.ingredients_list?.length)
              ? 'rgba(16,185,129,0.3)' : '#FFD700',
            cursor: 'pointer', padding: '0.25rem', touchAction: 'manipulation',
            fontSize: '0.8rem', fontWeight: '700'
          }}
        >
          {saving ? '...' : '✓'}
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {/* ── Foto (optioneel) ── */}
        <div style={{
          padding: isMobile ? '0.875rem 1rem' : '1rem 1.5rem',
          borderBottom: '1px solid rgba(255,255,255,0.06)'
        }}>
          {photoPreview ? (
            <div style={{
              position: 'relative', width: '100%', height: isMobile ? '160px' : '200px',
              borderRadius: '12px', overflow: 'hidden',
              background: 'rgba(255,255,255,0.04)',
            }}>
              <img
                src={photoPreview}
                alt="Maaltijd foto"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              {photoUploading && (
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'rgba(0,0,0,0.55)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#FFD700', fontSize: '0.75rem', fontWeight: '700',
                  letterSpacing: '0.05em', textTransform: 'uppercase',
                }}>
                  Uploaden…
                </div>
              )}
              <button
                onClick={handlePhotoRemove}
                aria-label="Foto verwijderen"
                disabled={photoUploading}
                style={{
                  position: 'absolute', top: '8px', right: '8px',
                  width: '32px', height: '32px',
                  background: 'rgba(0,0,0,0.7)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent'
                }}
              >
                <X size={15} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {/* iOS WKWebView crasht op `capture="environment"` zonder
                  NSCameraUsageDescription en blijft ook na permissie-fix
                  onbetrouwbaar. We bieden alleen nog Galerij — daar kan
                  iemand binnen iOS alsnog een nieuwe foto maken via de
                  systeem-picker. */}
              <PhotoPickerLabel
                isMobile={isMobile}
                label="Galerij"
                onChange={handlePhotoSelect}
              >
                <ImageIcon size={20} color="rgba(255,215,0,0.6)" strokeWidth={2} />
              </PhotoPickerLabel>
            </div>
          )}
        </div>

        {/* Naam */}
        <div style={{
          padding: isMobile ? '0.875rem 1rem' : '1rem 1.5rem',
          borderBottom: '1px solid rgba(255,255,255,0.06)'
        }}>
          <input
            type="text" value={meal.name || ''}
            onChange={(e) => setMeal({ ...meal, name: e.target.value })}
            placeholder="Naam van je maaltijd"
            style={{
              width: '100%', padding: '0', background: 'transparent',
              border: 'none', outline: 'none', color: '#fff',
              fontSize: isMobile ? '1.2rem' : '1.35rem', fontWeight: '800', letterSpacing: '-0.02em'
            }}
          />
        </div>

        {/* Maaltijd moment */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: isMobile ? '0.75rem 1rem' : '0.875rem 1.5rem',
          borderBottom: '1px solid rgba(255,255,255,0.06)', position: 'relative'
        }}>
          <div style={{ fontSize: '0.85rem', fontWeight: '500', color: 'rgba(255,255,255,0.6)' }}>Maaltijd</div>
          <button onClick={() => setShowMealDropdown(!showMealDropdown)} style={{
            padding: '0.5rem 0.75rem', background: 'transparent',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px',
            color: '#fff', fontSize: '0.8rem', fontWeight: '600',
            cursor: 'pointer', touchAction: 'manipulation', minHeight: '36px'
          }}>
            {currentMealLabel}
          </button>
          {showMealDropdown && (
            <>
              <div onClick={() => setShowMealDropdown(false)} style={{ position: 'fixed', inset: 0, zIndex: 99 }} />
              <div style={{
                position: 'absolute', top: '100%', right: isMobile ? '1rem' : '1.5rem',
                marginTop: '0.25rem', zIndex: 100, background: '#111',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px',
                overflow: 'hidden', minWidth: '160px', boxShadow: '0 8px 24px rgba(0,0,0,0.6)'
              }}>
                {MEAL_MOMENTS.map((m, i) => (
                  <button key={m.id} onClick={() => { setMealMoment(m.id); setShowMealDropdown(false) }}
                    style={{
                      display: 'block', width: '100%', padding: '0.75rem',
                      background: mealMoment === m.id ? 'rgba(16,185,129,0.08)' : 'transparent',
                      border: 'none', borderBottom: i < MEAL_MOMENTS.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                      color: mealMoment === m.id ? '#FFD700' : 'rgba(255,255,255,0.7)',
                      fontSize: '0.8rem', fontWeight: mealMoment === m.id ? '700' : '500',
                      cursor: 'pointer', textAlign: 'left', touchAction: 'manipulation', minHeight: '44px'
                    }}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Macro donut */}
        {meal.ingredients_list?.length > 0 && (
          <div style={{
            padding: isMobile ? '1rem' : '1.25rem 1.5rem',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', alignItems: 'center', gap: isMobile ? '1.25rem' : '1.5rem'
          }}>
            <div style={{ position: 'relative', width: '72px', height: '72px', flexShrink: 0 }}>
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
                position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center'
              }}>
                <div style={{ fontSize: '1rem', fontWeight: '800', color: '#fff', lineHeight: 1 }}>{Math.round(totals.calories)}</div>
                <div style={{ fontSize: '0.35rem', fontWeight: '600', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>cal</div>
              </div>
            </div>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between' }}>
              {[
                { label: 'Koolhydr', value: Math.round(totals.carbs), pct: carbPct, color: '#f59e0b' },
                { label: 'Vetten', value: Math.round(totals.fat), pct: fatPct, color: '#8b5cf6' },
                { label: 'Eiwitten', value: Math.round(totals.protein), pct: protPct, color: '#FFD700' }
              ].map(m => (
                <div key={m.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.55rem', fontWeight: '700', color: m.color }}>{m.pct} %</div>
                  <div style={{ fontSize: isMobile ? '0.9rem' : '1rem', fontWeight: '800', color: '#fff' }}>{m.value} g</div>
                  <div style={{ fontSize: '0.45rem', fontWeight: '600', color: m.color }}>{m.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Onderdelen maaltijd */}
        <div style={{ padding: isMobile ? '0.75rem 1rem 0.4rem' : '0.875rem 1.5rem 0.5rem' }}>
          <div style={{ fontSize: isMobile ? '1rem' : '1.1rem', fontWeight: '800', color: '#fff' }}>
            Onderdelen maaltijd
          </div>
        </div>

        {(meal.ingredients_list || []).map((ing, idx) => (
          <div key={idx} style={{
            display: 'flex', alignItems: 'center',
            padding: isMobile ? '0.625rem 1rem' : '0.75rem 1.5rem',
            borderBottom: '1px solid rgba(255,255,255,0.04)', gap: '0.5rem'
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: isMobile ? '0.82rem' : '0.88rem', fontWeight: '600', color: '#fff',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
              }}>
                {ing.name}
              </div>
              <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)' }}>
                {ing.brand ? `${ing.brand}, ` : ''}{ing.amount}{ing.unit || 'g'}
              </div>
            </div>
            <div style={{
              fontSize: isMobile ? '0.85rem' : '0.9rem', fontWeight: '800',
              color: 'rgba(255,255,255,0.5)', flexShrink: 0
            }}>
              {ing.calories || 0}
            </div>
            <button onClick={() => handleRemove(idx)} style={{
              width: '28px', height: '28px', borderRadius: '6px',
              background: 'transparent', border: '1px solid rgba(239,68,68,0.12)',
              color: 'rgba(239,68,68,0.35)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              touchAction: 'manipulation', flexShrink: 0
            }}>
              <Trash2 size={11} />
            </button>
          </div>
        ))}

        {/* Voeg ingrediënt toe */}
        <button onClick={onRequestAddIngredient} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: '0.375rem', width: '100%',
          padding: isMobile ? '0.875rem 1rem' : '1rem 1.5rem',
          background: 'transparent', border: 'none',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          color: '#FFD700', fontSize: isMobile ? '0.8rem' : '0.85rem',
          fontWeight: '700', cursor: 'pointer',
          touchAction: 'manipulation', minHeight: '48px'
        }}>
          <Plus size={15} strokeWidth={2.5} />
          Voeg ingrediënt toe
        </button>
      </div>

      {/* Bottom buttons */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        <div style={{
          display: 'flex', flexDirection: 'column', gap: '0.375rem',
          padding: isMobile ? '0.75rem 1rem' : '1rem 1.5rem',
          paddingBottom: isMobile ? '1.5rem' : '1rem'
        }}>
          {/* Big: Opslaan & Loggen */}
          {meal.ingredients_list?.length > 0 && (
            <button onClick={handleLogMeal}
              disabled={saving || !meal.name?.trim()}
              style={{
                width: '100%', padding: isMobile ? '0.875rem' : '1rem',
                background: (saving || !meal.name?.trim()) ? 'rgba(16,185,129,0.05)' : 'rgba(16,185,129,0.12)',
                border: '1px solid rgba(16,185,129,0.3)', borderRadius: '10px',
                color: '#FFD700', fontSize: isMobile ? '0.85rem' : '0.9rem',
                fontWeight: '800', cursor: (saving || !meal.name?.trim()) ? 'default' : 'pointer',
                minHeight: '48px', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem',
                opacity: (saving || !meal.name?.trim()) ? 0.4 : 1
              }}
            >
              <Check size={16} strokeWidth={2.5} />
              {saving ? 'Opslaan...' : 'Opslaan & Loggen'}
            </button>
          )}

          {/* Small: Alleen opslaan */}
          <button onClick={handleSave}
            disabled={saving || !meal.name?.trim() || !meal.ingredients_list?.length}
            style={{
              width: '100%', padding: isMobile ? '0.5rem' : '0.625rem',
              background: 'transparent', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '8px', color: 'rgba(255,255,255,0.35)',
              fontSize: isMobile ? '0.65rem' : '0.7rem', fontWeight: '600',
              cursor: 'pointer', minHeight: '32px', touchAction: 'manipulation',
              opacity: (saving || !meal.name?.trim() || !meal.ingredients_list?.length) ? 0.3 : 1
            }}
          >
            {saving ? 'Opslaan...' : 'Alleen opslaan (niet loggen)'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Photo picker tile — shared between Camera + Galerij buttons. Receives the
// lucide icon as a child so we don't trigger no-unused-vars on PascalCase
// destructuring (a quirk of this repo's eslint setup).
function PhotoPickerLabel({ isMobile, label, capture, onChange, children }) {
  return (
    <label style={{
      flex: 1, height: isMobile ? '72px' : '80px',
      background: 'rgba(255,215,0,0.04)',
      border: '1px dashed rgba(255,215,0,0.25)',
      borderRadius: '12px',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: '0.35rem', cursor: 'pointer', touchAction: 'manipulation',
      WebkitTapHighlightColor: 'transparent'
    }}>
      {children}
      <span style={{
        fontSize: '0.7rem',
        color: 'rgba(255,255,255,0.55)',
        fontWeight: '600',
        letterSpacing: '-0.005em'
      }}>
        {label}
      </span>
      <input
        type="file"
        accept="image/*"
        {...(capture ? { capture } : {})}
        onChange={onChange}
        style={{ display: 'none' }}
      />
    </label>
  )
}
