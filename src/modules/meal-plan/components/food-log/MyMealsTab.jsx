// src/modules/meal-plan/components/food-log/MyMealsTab.jsx
// 🎯 v3.0 - Uses parent buildingMeal state to survive tab switches
import React, { useState, useEffect } from 'react'
import { Plus, Trash2, Check, ArrowLeft, ChevronRight, ChevronDown, Camera, Image as ImageIcon, X, Calculator, Sunrise, Salad, Zap, Apple, Utensils, Package } from 'lucide-react'
import MealPrepCalculator from '../MealPrepCalculator'
import MealCard from '../day-schedule/MealCard'
import Keuze from '../Keuze'
import { foodImageFallback } from '../../foodImageFallback'


// Vaste secties waarin de klant z'n eigen maaltijden indeelt. Vast door ons
// bepaald; `moment` is het bijhorende log-moment, `emoji` de card-icoon-fallback.
const SECTIONS = [
  { id: 'ontbijt',     label: 'Mijn ontbijt',     moment: 'breakfast', Icon: Sunrise,  color: '#f59e0b' },
  { id: 'lunch',       label: 'Mijn lunch',       moment: 'lunch',     Icon: Salad,    color: '#10b981' },
  { id: 'pre_workout', label: 'Mijn pre-workout', moment: 'snack',     Icon: Zap,      color: '#3b82f6' },
  { id: 'snacks',      label: 'Mijn snacks',      moment: 'snack',     Icon: Apple,    color: '#ec4899' },
  { id: 'diner',       label: 'Mijn diner',       moment: 'dinner',    Icon: Utensils, color: '#8b5cf6' },
]
const SECTION_MOMENT = Object.fromEntries(SECTIONS.map(s => [s.id, s.moment]))

// In de database staan twee schrijfwijzen door elkaar: de secties hierboven
// ('ontbijt', 'diner', 'snacks') en de log-momenten ('breakfast', 'dinner',
// 'snack') — die laatste komen van de ster in het wisselvenster. Alles wordt
// hier op de sectie-id getrokken, anders belandt een ontbijt onder "Overige".
const MOMENT_SECTIE = {
  breakfast: 'ontbijt', ontbijt: 'ontbijt',
  lunch: 'lunch',
  dinner: 'diner', diner: 'diner', avondeten: 'diner',
  snack: 'snacks', snacks: 'snacks', tussendoortje: 'snacks',
  post_workout: 'snacks',
  pre_workout: 'pre_workout',
}
const sectieVan = (ruw) => MOMENT_SECTIE[String(ruw || '').toLowerCase()] || null

export default function MyMealsTab({ client, db, onLog, onRequestAddIngredient, buildingMeal, setBuildingMeal, isMobile }) {
  const [myMeals, setMyMeals] = useState([])
  const [loading, setLoading] = useState(true)
  const [showPrep, setShowPrep] = useState(false)
  // Filter + volgorde in plaats van vijf uitklap-secties.
  const [filterSectie, setFilterSectie] = useState('alle')
  const [sortering, setSortering] = useState('nieuwste')

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
      meal_type: SECTION_MOMENT[sectieVan(meal.section)] || 'snack', per100g: false,
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
    const sid = sectieVan(m.section) || 'overige'
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

  // Gefilterde, gesorteerde lijst. De uitklap-secties zijn vervangen door een
  // filter: met vijf secties die allemaal dicht staan zag je je eigen
  // maaltijden pas na twee tikken.
  const gefilterd = myMeals
    .filter(m => filterSectie === 'alle' || (sectieVan(m.section) || 'overige') === filterSectie)
    .sort((a, b) => {
      if (sortering === 'naam') return String(a.name || '').localeCompare(String(b.name || ''))
      if (sortering === 'kcal-hoog') return (b.calories || 0) - (a.calories || 0)
      if (sortering === 'kcal-laag') return (a.calories || 0) - (b.calories || 0)
      return new Date(b.updated_at || 0) - new Date(a.updated_at || 0)
    })

  const sectieOpties = [
    { id: 'alle', label: 'Alle maaltijden' },
    ...SECTIONS.map(sec => ({ id: sec.id, label: sec.label })),
    ...(mealsBySection.overige.length ? [{ id: 'overige', label: 'Overige' }] : []),
  ]
  const sorteerOpties = [
    { id: 'nieuwste', label: 'Nieuwste eerst' },
    { id: 'naam', label: 'Op naam' },
    { id: 'kcal-hoog', label: 'Meeste kcal' },
    { id: 'kcal-laag', label: 'Minste kcal' },
  ]
  const labelVan = (m) => (SECTIONS.find(sec => sec.id === sectieVan(m.section))?.label || 'Overige').replace(/^Mijn /, '')

  return (
    <div>
      {/* Twee acties bovenaan, in bold wit. */}
      <div style={{ display: 'flex', gap: 8, padding: isMobile ? '0.75rem 0.9rem 0.6rem' : '1rem 1.25rem 0.75rem' }}>
        <button
          onClick={() => handleCreateNew()}
          style={{
            flex: 1, minHeight: 46,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            background: '#fff', border: 'none', borderRadius: 12,
            color: '#0a0a0a', fontSize: isMobile ? '0.82rem' : '0.86rem', fontWeight: 900,
            fontFamily: 'inherit', cursor: 'pointer',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          }}
        >
          <Plus size={16} strokeWidth={3} /> Maaltijd aanmaken
        </button>
        <button
          onClick={() => setShowPrep(true)}
          aria-label="Meal-prep calculator"
          title="Meal-prep calculator"
          style={{
            width: 46, minHeight: 46, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'transparent', border: '1.5px solid rgba(255,255,255,0.28)',
            borderRadius: 12, color: '#fff', cursor: 'pointer',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          }}
        >
          <Calculator size={17} strokeWidth={2.6} />
        </button>
      </div>

      {/* Filters: welke sectie en in welke volgorde. */}
      <div style={{
        display: 'flex', alignItems: 'center',
        padding: isMobile ? '0 0.9rem 0.5rem' : '0 1.25rem 0.6rem',
      }}>
        <Keuze waarde={filterSectie} opties={sectieOpties} zet={setFilterSectie} isMobile={isMobile} />
        <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.15)', flexShrink: 0 }} />
        <Keuze waarde={sortering} opties={sorteerOpties} zet={setSortering} isMobile={isMobile} uitlijning="rechts" />
      </div>

      {showPrep && (
        <MealPrepCalculator
          client={client}
          db={db}
          onClose={() => setShowPrep(false)}
          onSaved={() => loadMyMeals()}
        />
      )}

      {gefilterd.length === 0 ? (
        <div style={{ padding: '2.5rem 1.25rem', textAlign: 'center' }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 900, color: '#fff', marginBottom: 4 }}>
            {myMeals.length === 0 ? 'Nog geen eigen maaltijden' : 'Niets in dit filter'}
          </div>
          <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>
            {myMeals.length === 0
              ? 'Maak er een aan; daarna log je hem met één tik.'
              : 'Kies een andere sectie hierboven.'}
          </div>
        </div>
      ) : (
        <div style={{ paddingBottom: '1rem' }}>
          {gefilterd.map(meal => (
            <MealCard
              key={meal.id}
              meal={{
                name: meal.name,
                image_url: meal.image_url,
                calories: meal.calories, protein: meal.protein,
                carbs: meal.carbs, fat: meal.fat,
              }}
              momentLabel={labelVan(meal)}
              isMobile={isMobile}
              onCheck={() => handleQuickLog(meal)}
              acties={[
                { icon: <Plus size={11} strokeWidth={3} />, label: 'Loggen', onClick: () => handleQuickLog(meal) },
                { icon: <ChevronRight size={11} strokeWidth={2.6} />, label: 'Bewerken', onClick: () => handleOpenMeal(meal) },
              ]}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════
// MEAL DETAIL VIEW
// ═══════════════════════════════════════════

function MealDetailView({ meal, setMeal, client, db, isMobile, onBack, onRequestAddIngredient, onLog }) {
  const [saving, setSaving] = useState(false)
  // Log-moment: standaard uit de gekozen sectie (bv. pre-workout → snack).
  // Je kiest de sectie ("Mijn diner"); het log-moment volgt daaruit. Eerder
  // koos je alleen het moment en werd de sectie nooit meegeschreven, dus bleef
  // een maaltijd onder "Overige" staan hoe vaak je Diner ook koos.
  const [sectie, setSectie] = useState(sectieVan(meal.section) || (meal._moment ? MOMENT_SECTIE[meal._moment] : null) || '')
  const mealMoment = SECTION_MOMENT[sectie] || meal._moment || 'snack'
  const sectieOptiesDetail = [
    ...SECTIONS.map(sec => ({ id: sec.id, label: sec.label.replace(/^Mijn /, '') })),
    { id: '', label: 'Geen sectie' },
  ]
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

  // In de database staan drie vormen van een ingrediëntregel door elkaar:
  //   1. {name, amount, unit, calories, …}          — deze bouwer
  //   2. {ingredient_name, amount_gram, calories, …} — meal-prep calculator
  //   3. {ingredient_id, amount, unit}               — verwijzing uit ai_meals
  // Alles wordt hier op vorm 1 getrokken; zonder dat las de regel "250gram"
  // zonder naam en telde vorm 2 niet mee in het totaal.
  const alsRegel = (ing) => ({
    ...ing,
    name: ing?.name || ing?.ingredient_name || ing?.naam || 'Ingrediënt',
    amount: ing?.amount ?? ing?.amount_gram ?? null,
    unit: ing?.unit || (ing?.amount_gram != null ? 'gram' : ''),
  })
  const regels = (meal.ingredients_list || []).map(alsRegel)

  // Totalen komen uit de ingrediënten. Draagt geen enkel ingrediënt macro's —
  // bijvoorbeeld een maaltijd die als verwijzingen is opgeslagen — dan zouden
  // de totalen op 0 komen en bij opslaan de echte waarden overschrijven. In
  // dat geval houden we de macro's van de maaltijd zelf aan.
  const berekend = regels.reduce((t, ing) => ({
    calories: t.calories + (parseFloat(ing.calories) || 0),
    protein: t.protein + (parseFloat(ing.protein) || 0),
    carbs: t.carbs + (parseFloat(ing.carbs) || 0),
    fat: t.fat + (parseFloat(ing.fat) || 0)
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 })
  const ingredientenHebbenMacros = berekend.calories > 0 || berekend.protein > 0 || berekend.carbs > 0 || berekend.fat > 0
  const totals = ingredientenHebbenMacros ? berekend : {
    calories: parseFloat(meal.calories) || 0,
    protein: parseFloat(meal.protein) || 0,
    carbs: parseFloat(meal.carbs) || 0,
    fat: parseFloat(meal.fat) || 0,
  }

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
    if (!meal.name?.trim()) return
    if (!meal.ingredients_list?.length && !totals.calories) return
    setSaving(true)
    try {
      const imageUrl = await resolveImageUrl()
      const mealData = {
        client_id: client.id, name: meal.name.trim(),
        calories: Math.round(totals.calories), protein: Math.round(totals.protein),
        carbs: Math.round(totals.carbs), fat: Math.round(totals.fat),
        ingredients_list: meal.ingredients_list, is_active: true,
        image_url: imageUrl,
        section: sectie || null,
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
        section: sectie || null,
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Kop: terug, titel, opslaan — alles in bold wit. */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: isMobile ? '0.6rem 0.9rem' : '0.75rem 1.25rem',
        borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0,
      }}>
        <button onClick={onBack} style={{
          background: 'none', border: 'none', color: '#fff',
          cursor: 'pointer', padding: '0.25rem', touchAction: 'manipulation',
          display: 'flex', alignItems: 'center', gap: 5,
          fontSize: '0.8rem', fontWeight: 800, fontFamily: 'inherit',
        }}>
          <ArrowLeft size={16} strokeWidth={2.6} /> Terug
        </button>
        <div style={{ fontSize: isMobile ? '0.95rem' : '1.05rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>
          {meal.id ? 'Maaltijd bewerken' : 'Maaltijd aanmaken'}
        </div>
        <button onClick={handleSave}
          disabled={saving || !meal.name?.trim() || (!meal.ingredients_list?.length && !totals.calories)}
          aria-label="Opslaan"
          style={{
            width: 32, height: 32, borderRadius: 9,
            background: 'transparent', border: 'none',
            color: '#fff', opacity: (saving || !meal.name?.trim() || (!meal.ingredients_list?.length && !totals.calories)) ? 0.3 : 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', touchAction: 'manipulation',
          }}
        >
          <Check size={17} strokeWidth={3} />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {/* ── Foto ── */}
        <div style={{ padding: isMobile ? '0.875rem 1rem' : '1rem 1.5rem' }}>
          {photoPreview ? (
            <div style={{
              position: 'relative', width: '100%', height: isMobile ? '160px' : '200px',
              borderRadius: 14, overflow: 'hidden', background: 'rgba(255,255,255,0.04)',
            }}>
              <img src={photoPreview} alt="Maaltijd foto" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              {photoUploading && (
                <div style={{
                  position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: '0.75rem', fontWeight: 900,
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
                  position: 'absolute', top: 8, right: 8, width: 32, height: 32,
                  background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: 9,
                  color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                }}
              >
                <X size={15} strokeWidth={2.6} />
              </button>
            </div>
          ) : (
            <PhotoPickerLabel isMobile={isMobile} label="Foto toevoegen" onChange={handlePhotoSelect}>
              <ImageIcon size={20} color="#fff" strokeWidth={2.2} />
            </PhotoPickerLabel>
          )}
        </div>

        {/* Naam */}
        <div style={{ padding: isMobile ? '0 1rem 0.75rem' : '0 1.5rem 0.875rem' }}>
          <input
            type="text" value={meal.name || ''}
            onChange={(e) => setMeal({ ...meal, name: e.target.value })}
            placeholder="Naam van je maaltijd"
            style={{
              width: '100%', padding: 0, background: 'transparent',
              border: 'none', outline: 'none', color: '#fff',
              fontSize: isMobile ? '1.3rem' : '1.5rem', fontWeight: 900,
              letterSpacing: '-0.03em', fontFamily: 'inherit',
            }}
          />
        </div>

        {/* Moment — zelfde keuzemenu als de rest van de voedingsschermen. */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: isMobile ? '0 1rem 0.9rem' : '0 1.5rem 1rem',
        }}>
          <div style={{
            fontSize: '0.62rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)',
            textTransform: 'uppercase', letterSpacing: '0.1em',
          }}>
            Sectie
          </div>
          <div style={{ width: 160 }}>
            <Keuze
              waarde={sectie}
              opties={sectieOptiesDetail}
              zet={setSectie}
              isMobile={isMobile}
              uitlijning="rechts"
            />
          </div>
        </div>

        {/* Macro's in vier vakjes, zoals in het wisselvenster. */}
        <div style={{ display: 'flex', gap: '0.5rem', padding: isMobile ? '0 1rem 1rem' : '0 1.5rem 1.25rem' }}>
          {[
            { label: 'kcal', waarde: Math.round(totals.calories) },
            { label: 'eiwit', waarde: `${Math.round(totals.protein)}g` },
            { label: 'koolh', waarde: `${Math.round(totals.carbs)}g` },
            { label: 'vet', waarde: `${Math.round(totals.fat)}g` },
          ].map(m => (
            <div key={m.label} style={{
              flex: 1, minWidth: 0, textAlign: 'center',
              padding: '0.55rem 0.25rem',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10,
            }}>
              <div style={{ fontSize: isMobile ? '1rem' : '1.1rem', fontWeight: 900, color: '#fff', lineHeight: 1.1 }}>
                {m.waarde}
              </div>
              <div style={{
                fontSize: '0.55rem', fontWeight: 800, color: 'rgba(255,255,255,0.35)',
                textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2,
              }}>
                {m.label}
              </div>
            </div>
          ))}
        </div>

        <div style={{ padding: isMobile ? '0 1rem 0.5rem' : '0 1.5rem 0.6rem' }}>
          <div style={{
            fontSize: '0.62rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)',
            textTransform: 'uppercase', letterSpacing: '0.1em',
          }}>
            Ingrediënten
          </div>
        </div>

        {/* Ingrediënten als dezelfde kaart als overal: gram rechts, weghalen
            als enige knop. */}
        {regels.map((ing, idx) => (
          <MealCard
            key={`${ing.name}-${idx}`}
            meal={{
              name: ing.name,
              image_url: ing.image_url || foodImageFallback(ing.name, null, 200),
              calories: ing.calories, protein: ing.protein,
              carbs: ing.carbs, fat: ing.fat,
            }}
            momentLabel=""
            rechts={`${ing.amount ?? '?'}${ing.unit === 'gram' ? 'g' : (ing.unit || 'g')}`}
            isMobile={isMobile}
            acties={[{
              icon: <Trash2 size={11} />, label: 'Weghalen',
              onClick: () => handleRemove(idx), kleur: 'rgba(239,68,68,0.85)',
            }]}
          />
        ))}

        <div style={{ padding: isMobile ? '0.5rem 0.9rem 1rem' : '0.6rem 1.25rem 1.25rem' }}>
          <button onClick={onRequestAddIngredient} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            width: '100%', minHeight: 46,
            background: 'transparent', border: '1.5px solid rgba(255,255,255,0.28)',
            borderRadius: 12, color: '#fff',
            fontSize: isMobile ? '0.82rem' : '0.86rem', fontWeight: 900,
            fontFamily: 'inherit', cursor: 'pointer',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          }}>
            <Plus size={15} strokeWidth={3} /> Ingrediënt toevoegen
          </button>
        </div>
      </div>

      {/* Onderaan: opslaan en loggen. */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 8,
          padding: isMobile ? '0.75rem 1rem' : '1rem 1.5rem',
          paddingBottom: isMobile ? '1.5rem' : '1rem',
        }}>
          <button onClick={handleLogMeal}
            disabled={saving || !meal.name?.trim() || (!meal.ingredients_list?.length && !totals.calories)}
            style={{
              width: '100%', minHeight: 50,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              background: '#fff', border: 'none', borderRadius: 12,
              color: '#0a0a0a', fontSize: isMobile ? '0.9rem' : '0.95rem', fontWeight: 900,
              fontFamily: 'inherit', cursor: saving ? 'wait' : 'pointer',
              opacity: (saving || !meal.name?.trim() || (!meal.ingredients_list?.length && !totals.calories)) ? 0.4 : 1,
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            }}
          >
            <Check size={16} strokeWidth={3} />
            {saving ? 'Opslaan…' : 'Opslaan en loggen'}
          </button>

          <button onClick={handleSave}
            disabled={saving || !meal.name?.trim() || (!meal.ingredients_list?.length && !totals.calories)}
            style={{
              width: '100%', minHeight: 38,
              background: 'transparent', border: 'none',
              color: 'rgba(255,255,255,0.45)',
              fontSize: '0.78rem', fontWeight: 800, fontFamily: 'inherit',
              cursor: 'pointer', touchAction: 'manipulation',
            }}
          >
            {saving ? 'Opslaan…' : 'Alleen opslaan'}
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
      background: 'transparent',
      border: '1.5px dashed rgba(255,255,255,0.25)',
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
