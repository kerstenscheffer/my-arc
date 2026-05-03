// src/modules/meal-plan/components/AIMealInfoModal.jsx
// 🎯 v2.2 - DEBUG versie met volledige logging
import React, { useState, useEffect } from 'react'
import { X, Info, ChefHat, Euro, Lightbulb, Clock, Package, AlertCircle, CheckCircle, Sparkles } from 'lucide-react'
import { toHumanAmount } from '../../ai-meal-generator/utils/unitConverter'

export default function AIMealInfoModal({ isOpen, onClose, meal, db }) {
  const isMobile = window.innerWidth <= 768
  const [activeTab, setActiveTab] = useState('info')
  const [ingredients, setIngredients] = useState([])
  const [loading, setLoading] = useState(false)
  const [dbMealData, setDbMealData] = useState(null)


  useEffect(() => {
    if (isOpen && meal) {
      setDbMealData(null)
      setIngredients([])
      loadData()
    }
  }, [isOpen, meal?.id, meal?.meal_id])

  const loadData = async () => {
    const mealId = meal?.meal_id || meal?.id
    setLoading(true)

    try {
      // 1. Haal meal data op uit DB
      if (mealId) {
        const { data: mealRow, error: mealError } = await db.supabase
          .from('ai_meals')
          .select('preparation_steps, tips')
          .eq('id', mealId)
          .single()


        if (mealRow && !mealError) {
          setDbMealData(mealRow)
        } else {
        }
      } else {
      }

      // 2. Haal ingrediënten op
      const ingList = meal?.ingredients_list || []
      const ids = ingList.filter(i => i?.ingredient_id).map(i => i.ingredient_id)

      if (ids.length > 0) {
        const { data: ingData, error: ingError } = await db.supabase
          .from('ai_ingredients')
          .select('*')
          .in('id', ids)


        if (ingData) {
          const mapped = ingList.map(item => {
            const ing = ingData.find(i => i.id === item.ingredient_id)
            return ing ? { ...ing, amount: item.amount, unit: item.unit || 'gram' } : null
          }).filter(Boolean)
          setIngredients(mapped)
        }
      }
    } catch (e) {
      console.error('❌ loadData error:', e)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !meal) return null

  // Merge meal prop met DB data
  const effectiveMeal = {
    ...meal,
    // ✅ Prioriteit: meal prop (snapshot) als die steps heeft, anders DB
    preparation_steps: meal.preparation_steps?.length
      ? meal.preparation_steps
      : (dbMealData?.preparation_steps || []),
    tips: meal.tips || dbMealData?.tips || null,
  }


  const calcMacros = (ing) => {
    if (!ing) return { calories: 0, protein: 0, carbs: 0, fat: 0 }
    const f = ing.amount / 100
    return {
      calories: Math.round((ing.calories_per_100g || 0) * f),
      protein: Math.round((ing.protein_per_100g || 0) * f * 10) / 10,
      carbs: Math.round((ing.carbs_per_100g || 0) * f * 10) / 10,
      fat: Math.round((ing.fat_per_100g || 0) * f * 10) / 10
    }
  }

  const getMealImage = () => {
    if (meal?.image_url) return meal.image_url
    const fallbacks = {
      breakfast: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800&h=400&fit=crop&q=80',
      lunch: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&h=400&fit=crop&q=80',
      dinner: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&h=400&fit=crop&q=80',
      snack: 'https://images.unsplash.com/photo-1490474504059-bf2db5ab2348?w=800&h=400&fit=crop&q=80'
    }
    return fallbacks[meal?.meal_type] || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=400&fit=crop&q=80'
  }

  const tabs = [
    { id: 'info', label: 'Info', icon: Info },
    { id: 'recipe', label: 'Recept', icon: ChefHat },
    { id: 'price', label: 'Prijs', icon: Euro },
    { id: 'tips', label: 'Tips', icon: Lightbulb }
  ]

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(12px)', display: 'flex', flexDirection: 'column', zIndex: 10500, animation: 'infoFadeIn 0.2s ease' }}>
      <div onClick={e => e.stopPropagation()} style={{ flex: 1, display: 'flex', flexDirection: 'column', maxWidth: isMobile ? '100%' : '600px', width: '100%', margin: '0 auto', background: '#0a0a0a', overflow: 'hidden' }}>

        {/* Hero */}
        <div style={{ position: 'relative', height: isMobile ? '180px' : '220px', flexShrink: 0 }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${getMealImage()})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #0a0a0a 0%, rgba(0,0,0,0.3) 40%, transparent 70%)' }} />
          <button onClick={onClose} style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', width: '36px', height: '36px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}><X size={18} /></button>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: isMobile ? '0 1rem 0.75rem' : '0 1.5rem 1rem' }}>
            <div style={{ fontSize: isMobile ? '1.15rem' : '1.35rem', fontWeight: '800', color: '#fff', letterSpacing: '-0.02em', marginBottom: '0.4rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {meal.name || meal.meal_name}
            </div>
            <div style={{ display: 'flex', gap: '0.875rem' }}>
              {[{ val: meal.calories, label: 'kcal' }, { val: meal.protein, label: 'eiwit' }, { val: meal.carbs, label: 'koolh' }, { val: meal.fat, label: 'vet' }].filter(m => m.val > 0).map(m => (
                <div key={m.label} style={{ display: 'flex', alignItems: 'baseline', gap: '0.15rem' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: '800', color: '#fff' }}>{Math.round(m.val)}</span>
                  <span style={{ fontSize: '0.5rem', fontWeight: '600', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>{m.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          {tabs.map(tab => {
            const TabIcon = tab.icon
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ flex: 1, padding: '0.65rem 0', background: 'transparent', border: 'none', borderBottom: activeTab === tab.id ? '2px solid #10b981' : '2px solid transparent', color: activeTab === tab.id ? '#fff' : 'rgba(255,255,255,0.35)', fontSize: '0.68rem', fontWeight: activeTab === tab.id ? '800' : '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
                <TabIcon size={13} />{tab.label}
              </button>
            )
          })}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
          {activeTab === 'info' && <InfoTab meal={effectiveMeal} ingredients={ingredients} loading={loading} calcMacros={calcMacros} isMobile={isMobile} />}
          {activeTab === 'recipe' && <RecipeTab meal={effectiveMeal} loading={loading} isMobile={isMobile} />}
          {activeTab === 'price' && <PriceTab meal={effectiveMeal} ingredients={ingredients} isMobile={isMobile} />}
          {activeTab === 'tips' && <TipsTab meal={effectiveMeal} isMobile={isMobile} />}
        </div>
      </div>
      <style>{`@keyframes infoFadeIn { from { opacity: 0; } to { opacity: 1; } } @keyframes infoSpin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

function InfoTab({ meal, ingredients, loading, calcMacros, isMobile }) {
  return (
    <div>
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        {[{ label: 'Bereiding', val: `${meal.prep_time_min || 10} min` }, { label: 'Kooktijd', val: `${meal.cook_time_min || 15} min` }, { label: 'Niveau', val: meal.difficulty || 'Medium' }].map((item, i) => (
          <div key={item.label} style={{ flex: 1, padding: '0.7rem 0', textAlign: 'center', borderRight: i < 2 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
            <div style={{ fontSize: '0.45rem', fontWeight: '700', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.2rem' }}>{item.label}</div>
            <div style={{ fontSize: '0.78rem', fontWeight: '700', color: '#fff' }}>{item.val}</div>
          </div>
        ))}
      </div>
      <div style={{ padding: isMobile ? '0.75rem 1rem' : '1rem 1.5rem' }}>
        <div style={{ fontSize: '0.58rem', fontWeight: '700', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Ingrediënten</div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '1.5rem' }}><div style={{ width: '24px', height: '24px', border: '2px solid rgba(255,255,255,0.06)', borderTopColor: 'rgba(255,255,255,0.3)', borderRadius: '50%', margin: '0 auto', animation: 'infoSpin 0.8s linear infinite' }} /></div>
        ) : ingredients.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {ingredients.map((ing, idx) => {
              const macros = calcMacros(ing)
              return (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: idx < ingredients.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: '600', color: 'rgba(255,255,255,0.8)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ing.name}</div>
                    <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.25)', marginTop: '0.1rem' }}>{macros.calories} kcal · {macros.protein}g E</div>
                  </div>
                  <div style={{ fontSize: '0.72rem', fontWeight: '700', color: 'rgba(255,255,255,0.5)', flexShrink: 0, marginLeft: '0.5rem' }}>
                    {toHumanAmount(ing.name, ing.amount)}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.8rem', padding: '1rem 0' }}>Geen ingrediënten beschikbaar</div>
        )}
      </div>
      {meal.allergens?.length > 0 && (
        <div style={{ margin: isMobile ? '0 1rem 1rem' : '0 1.5rem 1.5rem', padding: '0.625rem 0.75rem', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.12)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={14} color="#ef4444" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: '0.75rem', color: 'rgba(239,68,68,0.8)' }}>{meal.allergens.join(', ')}</span>
        </div>
      )}
    </div>
  )
}

function RecipeTab({ meal, loading, isMobile }) {
  const steps = meal?.preparation_steps || []

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div style={{ width: '24px', height: '24px', border: '2px solid rgba(255,255,255,0.06)', borderTopColor: '#10b981', borderRadius: '50%', margin: '0 auto', animation: 'infoSpin 0.8s linear infinite' }} />
        <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.2)', marginTop: '0.5rem' }}>Recept laden...</div>
      </div>
    )
  }

  return (
    <div style={{ padding: isMobile ? '0.75rem 1rem' : '1rem 1.5rem' }}>
      {steps.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {steps.map((step, idx) => (
            <div key={idx} style={{ display: 'flex', gap: '0.625rem', padding: '0.5rem 0', borderBottom: idx < steps.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}>
              <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.65rem', fontWeight: '800', color: '#10b981' }}>
                {idx + 1}
              </div>
              <p style={{ fontSize: isMobile ? '0.8rem' : '0.85rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.5, margin: 0, paddingTop: '0.1rem' }}>{step}</p>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '2rem 0', color: 'rgba(255,255,255,0.2)', fontSize: '0.8rem' }}>
          Geen recept beschikbaar
        </div>
      )}
      {meal.tips && (
        <div style={{ marginTop: '1rem', padding: '0.625rem 0.75rem', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          <div style={{ fontSize: '0.55rem', fontWeight: '700', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.3rem' }}>Tip</div>
          <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5, margin: 0 }}>{meal.tips}</p>
        </div>
      )}
    </div>
  )
}

function PriceTab({ meal, ingredients, isMobile }) {
  const totalCost = meal.total_cost || 0
  return (
    <div>
      <div style={{ padding: isMobile ? '1rem' : '1.25rem', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ fontSize: '0.5rem', fontWeight: '700', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.25rem' }}>Totale kosten</div>
        <div style={{ fontSize: '1.85rem', fontWeight: '900', color: '#fff', letterSpacing: '-0.03em' }}>€{totalCost.toFixed(2)}</div>
      </div>
      <div style={{ padding: isMobile ? '0.75rem 1rem' : '1rem 1.5rem' }}>
        {ingredients.length > 0 ? ingredients.map((ing, idx) => {
          const cost = ing.price_per_unit ? (ing.amount / 1000) * ing.price_per_unit : 0
          return (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0', borderBottom: idx < ingredients.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}>
              <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)' }}>{ing.name}</span>
              <span style={{ fontSize: '0.78rem', fontWeight: '700', color: 'rgba(255,255,255,0.4)' }}>€{cost.toFixed(2)}</span>
            </div>
          )
        }) : <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.8rem', padding: '1rem 0' }}>Geen prijsinformatie beschikbaar</div>}
      </div>
    </div>
  )
}

function TipsTab({ meal, isMobile }) {
  const tips = [
    ...(meal.tips ? [{ text: meal.tips, icon: CheckCircle }] : []),
    { text: 'Bereid ingrediënten van tevoren voor om tijd te besparen', icon: Clock },
    { text: 'Bewaar restjes in een luchtdichte container tot 3 dagen', icon: Package },
    { text: 'Voeg verse kruiden toe voor extra smaak', icon: Sparkles }
  ]
  return (
    <div style={{ padding: isMobile ? '0.75rem 1rem' : '1rem 1.5rem' }}>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {tips.map((tip, idx) => {
          const TipIcon = tip.icon
          return (
            <div key={idx} style={{ display: 'flex', gap: '0.625rem', padding: '0.625rem 0', borderBottom: idx < tips.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}>
              <TipIcon size={14} color="rgba(255,255,255,0.3)" style={{ flexShrink: 0, marginTop: '0.1rem' }} />
              <p style={{ fontSize: isMobile ? '0.8rem' : '0.85rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5, margin: 0 }}>{tip.text}</p>
            </div>
          )
        })}
      </div>
      {meal.labels?.length > 0 && (
        <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          <div style={{ fontSize: '0.5rem', fontWeight: '700', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.4rem' }}>Eigenschappen</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
            {meal.labels.map((label, idx) => (
              <span key={idx} style={{ padding: '0.2rem 0.5rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '4px', fontSize: '0.6rem', fontWeight: '700', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{label}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
