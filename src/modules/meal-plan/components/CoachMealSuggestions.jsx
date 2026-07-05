// src/modules/meal-plan/components/CoachMealSuggestions.jsx
// Coach bubble slider met meal suggesties uit coach_meal_favorites,
// gefilterd op tijd van de dag.

import React, { useState, useEffect } from 'react'

const COACH_PHOTO_URL = 'https://i.ibb.co/mCQzTZrZ/ea169061-c9f1-4b4d-ab88-fc746cbde003.jpg'
const COACH_ID = '5a0135ac-3188-499d-8682-ed6a179e5541'

function getTimeSlot() {
  const h = new Date().getHours()
  if (h >= 5 && h < 10) return 'breakfast'
  if (h >= 10 && h < 12) return 'pre_workout'
  if (h >= 12 && h < 15) return 'lunch'
  if (h >= 15 && h < 18) return 'snack'
  if (h >= 18 && h < 22) return 'dinner'
  return 'before_bed'
}

const TIPS = {
  breakfast: 'Begin je dag met een eiwitrijke maaltijd. Lean eiwitten houden je lang vol, behouden je spieren én houden je energiek de hele ochtend.',
  lunch: 'Eet zoveel mogelijk eiwitten bij de lunch. Die houden je vol en behouden je spieren — voeg ook veel groente toe!',
  dinner: 'Avondeten: focus op lean eiwitten en zoveel mogelijk groente en fruit. Zo herstel je optimaal en behoud je je spiermassa.',
  snack: 'Kies voor een eiwitrijke snack. Die houdt je vol zonder veel calorieën en ondersteunt je spieren de hele dag.',
  pre_workout: 'Geef je lichaam de brandstof die het nodig heeft voor een goede training. Koolhydraten + lean eiwitten is de winnende combi.',
  before_bed: 'Een eiwitrijke avondsnack ondersteunt je spieropbouw terwijl je slaapt. Slim én lekker.',
}

const TIME_LABELS = {
  breakfast: 'Ontbijt',
  lunch: 'Lunch',
  dinner: 'Avondeten',
  snack: 'Snack',
  pre_workout: 'Pre-workout',
  before_bed: 'Voor het slapen',
}

export default function CoachMealSuggestions({ db, isMobile }) {
  const [meals, setMeals] = useState([])
  const [idx, setIdx] = useState(0)
  const timeSlot = getTimeSlot()

  useEffect(() => {
    async function load() {
      try {
        const { data } = await db.supabase
          .from('coach_meal_favorites')
          .select('ai_meals(id, name, calories, protein, carbs, fat, timing)')
          .eq('coach_id', COACH_ID)

        if (!data) return

        const all = data.map(r => r.ai_meals).filter(Boolean)
        const byTime = all.filter(m => Array.isArray(m.timing) && m.timing.includes(timeSlot))
        setMeals(byTime.length > 0 ? byTime : all)
      } catch (e) {
        console.error('CoachMealSuggestions load failed:', e)
      }
    }
    load()
  }, [db])

  if (meals.length === 0) return null

  const meal = meals[idx]

  return (
    <div style={{ padding: isMobile ? '0 0.75rem 1rem' : '0 1.5rem 1.25rem' }}>
      <div style={{ fontSize: isMobile ? '0.72rem' : '0.78rem', fontWeight: 800, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.6rem' }}>
        Coach tip — {TIME_LABELS[timeSlot]}
      </div>

      <div style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 16,
        padding: isMobile ? '0.875rem' : '1.125rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.875rem',
      }}>
        {/* Coach bubble */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
          <img
            src={COACH_PHOTO_URL}
            alt="Coach Kersten"
            style={{
              width: isMobile ? 44 : 52,
              height: isMobile ? 44 : 52,
              borderRadius: '50%',
              objectFit: 'cover',
              border: '2px solid rgba(255,215,0,0.5)',
              flexShrink: 0,
            }}
            onError={e => { e.currentTarget.style.display = 'none' }}
          />
          <div style={{
            flex: 1,
            background: 'rgba(255,215,0,0.06)',
            border: '1px solid rgba(255,215,0,0.18)',
            borderRadius: 12,
            padding: isMobile ? '0.625rem 0.875rem' : '0.75rem 1rem',
          }}>
            <div style={{ fontSize: isMobile ? '0.65rem' : '0.7rem', fontWeight: 800, color: '#FFD700', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Kersten · Coach
            </div>
            <p style={{ margin: 0, fontSize: isMobile ? '0.875rem' : '0.935rem', color: 'rgba(255,255,255,0.9)', fontWeight: 500, lineHeight: 1.55 }}>
              {TIPS[timeSlot]}
            </p>
          </div>
        </div>

        {/* Meal suggestion card */}
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12,
          padding: isMobile ? '0.75rem' : '0.875rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
        }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: isMobile ? '0.68rem' : '0.72rem', color: 'rgba(255,255,255,0.4)', fontWeight: 800, marginBottom: '0.2rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Suggestie
            </div>
            <div style={{ fontSize: isMobile ? '0.95rem' : '1rem', fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {meal.name}
            </div>
            <div style={{ fontSize: isMobile ? '0.8rem' : '0.85rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.2rem' }}>
              {Math.round(meal.calories || 0)} kcal &middot; {Math.round(meal.protein || 0)}g eiwit
            </div>
          </div>

          {meals.length > 1 && (
            <div style={{ display: 'flex', gap: '0.375rem', flexShrink: 0 }}>
              <button
                onClick={() => setIdx(i => (i - 1 + meals.length) % meals.length)}
                style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.8)', fontSize: '1.1rem',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >‹</button>
              <button
                onClick={() => setIdx(i => (i + 1) % meals.length)}
                style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.8)', fontSize: '1.1rem',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >›</button>
            </div>
          )}
        </div>

        {/* Dot indicators */}
        {meals.length > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.35rem' }}>
            {meals.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                style={{
                  width: i === idx ? 16 : 6,
                  height: 6,
                  borderRadius: 999,
                  background: i === idx ? '#FFD700' : 'rgba(255,255,255,0.18)',
                  border: 'none', cursor: 'pointer', padding: 0,
                  transition: 'width 0.22s ease, background 0.22s ease',
                  WebkitTapHighlightColor: 'transparent',
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
