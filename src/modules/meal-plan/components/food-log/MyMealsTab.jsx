// src/modules/meal-plan/components/food-log/MyMealsTab.jsx
// 🎯 v3.0 - Uses parent buildingMeal state to survive tab switches
import React, { useState, useEffect } from 'react'
import { Plus, Trash2, Check, ArrowLeft, ChevronRight } from 'lucide-react'

const MEAL_MOMENTS = [
  { id: 'breakfast', label: 'Ontbijt' },
  { id: 'lunch', label: 'Lunch' },
  { id: 'dinner', label: 'Avondeten' },
  { id: 'snack', label: 'Tussendoortjes' }
]

export default function MyMealsTab({ client, db, onLog, onRequestAddIngredient, buildingMeal, setBuildingMeal, isMobile }) {
  const [myMeals, setMyMeals] = useState([])
  const [loading, setLoading] = useState(true)

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
      meal_type: 'snack', per100g: false
    })
  }

  const handleCreateNew = () => {
    setBuildingMeal({
      id: null, name: '', ingredients_list: [],
      calories: 0, protein: 0, carbs: 0, fat: 0
    })
  }

  const handleOpenMeal = (meal) => {
    setBuildingMeal({ ...meal, ingredients_list: meal.ingredients_list || [] })
  }

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
          background: 'rgba(16, 185, 129, 0.04)', border: 'none',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          color: '#10b981', fontSize: isMobile ? '0.8rem' : '0.85rem',
          fontWeight: '700', cursor: 'pointer',
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minHeight: '48px'
        }}
      >
        <Plus size={16} strokeWidth={2.5} />
        Maaltijd aanmaken
      </button>

      {myMeals.length === 0 ? (
        <div style={{ padding: '3rem 1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'rgba(255,255,255,0.3)', marginBottom: '0.5rem' }}>
            Nog geen opgeslagen maaltijden
          </div>
          <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.15)' }}>
            Stel je eerste maaltijd samen
          </div>
        </div>
      ) : (
        myMeals.map((meal, idx) => (
          <div key={meal.id} style={{
            display: 'flex', alignItems: 'center',
            borderBottom: idx < myMeals.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none'
          }}>
            <button
              onClick={() => handleOpenMeal(meal)}
              style={{
                flex: 1, minWidth: 0, display: 'flex', alignItems: 'center',
                padding: isMobile ? '0.75rem 1rem' : '0.875rem 1.25rem',
                background: 'transparent', border: 'none', cursor: 'pointer',
                textAlign: 'left', touchAction: 'manipulation', minHeight: '56px', gap: '0.5rem'
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: isMobile ? '0.85rem' : '0.9rem', fontWeight: '700', color: '#fff',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                }}>
                  {meal.name}
                </div>
                <div style={{ display: 'flex', gap: '0.375rem', marginTop: '0.2rem' }}>
                  <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.35)' }}>
                    <span style={{ fontWeight: '800', color: 'rgba(255,255,255,0.5)' }}>{meal.calories || 0}</span> kcal
                  </span>
                  {meal.ingredients_list && Array.isArray(meal.ingredients_list) && (
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
              style={{
                width: '48px', minHeight: '56px', flexShrink: 0,
                background: 'transparent', border: 'none',
                borderLeft: '1px solid rgba(255,255,255,0.04)',
                color: '#10b981', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                touchAction: 'manipulation'
              }}
            >
              <Plus size={16} strokeWidth={2.5} />
            </button>
          </div>
        ))
      )}
    </div>
  )
}

// ═══════════════════════════════════════════
// MEAL DETAIL VIEW
// ═══════════════════════════════════════════

function MealDetailView({ meal, setMeal, client, db, isMobile, onBack, onRequestAddIngredient, onLog }) {
  const [saving, setSaving] = useState(false)
  const [showMealDropdown, setShowMealDropdown] = useState(false)
  const [mealMoment, setMealMoment] = useState('breakfast')

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

  const handleSave = async () => {
    if (!meal.name?.trim() || !meal.ingredients_list?.length) return
    setSaving(true)
    try {
      const mealData = {
        client_id: client.id, name: meal.name.trim(),
        calories: Math.round(totals.calories), protein: Math.round(totals.protein),
        carbs: Math.round(totals.carbs), fat: Math.round(totals.fat),
        ingredients_list: meal.ingredients_list, is_active: true,
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
    try {
      const mealData = {
        client_id: client.id, name: meal.name.trim() || 'Mijn maaltijd',
        calories: Math.round(totals.calories), protein: Math.round(totals.protein),
        carbs: Math.round(totals.carbs), fat: Math.round(totals.fat),
        ingredients_list: meal.ingredients_list, is_active: true,
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
      meal_type: mealMoment, per100g: false
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
              ? 'rgba(16,185,129,0.3)' : '#10b981',
            cursor: 'pointer', padding: '0.25rem', touchAction: 'manipulation',
            fontSize: '0.8rem', fontWeight: '700'
          }}
        >
          {saving ? '...' : '✓'}
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
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
                      color: mealMoment === m.id ? '#10b981' : 'rgba(255,255,255,0.7)',
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
                <circle cx="18" cy="18" r="14" fill="none" stroke="#10b981" strokeWidth="3.5"
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
                { label: 'Eiwitten', value: Math.round(totals.protein), pct: protPct, color: '#10b981' }
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
          color: '#10b981', fontSize: isMobile ? '0.8rem' : '0.85rem',
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
                color: '#10b981', fontSize: isMobile ? '0.85rem' : '0.9rem',
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
