// src/modules/coach-command-center/components/insight/guided-plan/MealSelector.jsx
// Zoek + selecteer maaltijden uit ai_meals DB
// v1.1 — volledige meal data inclusief ingredients_list

import React, { useState, useEffect, useRef } from 'react'
import { Search, Check, X } from 'lucide-react'

export default function MealSelector({ db, slotType, selectedMeals = [], onToggle, maxSelect = 1, isMobile }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const searchRef = useRef(null)
  const debounceRef = useRef(null)
  const m = isMobile

  const timingMap = {
    breakfast: 'breakfast',
    lunch: 'lunch',
    dinner: 'dinner',
    snack: 'snack'
  }

  // Laad initiële suggesties op mount
  useEffect(() => {
    loadSuggestions('')
  }, [slotType])

  const loadSuggestions = async (q) => {
    if (!db?.supabase) return
    setLoading(true)
    try {
      let queryBuilder = db.supabase
        .from('ai_meals')
        .select('id, name, calories, protein, carbs, fat, timing, image_url, ingredients_list, preparation_steps, allergens, labels')
        .order('name')
        .limit(30)

      if (q.trim().length > 0) {
        queryBuilder = queryBuilder.ilike('name', `%${q}%`)
      } else {
        // Zonder zoekterm: filter op timing
        const timing = timingMap[slotType]
        if (timing) queryBuilder = queryBuilder.contains('timing', [timing])
      }

      const { data } = await queryBuilder
      setResults(data || [])
    } catch (e) {
      console.warn('MealSelector search failed:', e)
    }
    setLoading(false)
  }

  const handleSearch = (val) => {
    setQuery(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => loadSuggestions(val), 300)
  }

  const isSelected = (meal) => selectedMeals.some(m => m.id === meal.id)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
      {/* Geselecteerde maaltijden */}
      {selectedMeals.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', marginBottom: '0.1rem' }}>
          {selectedMeals.map(meal => (
            <div key={meal.id} style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.3rem 0.5rem',
              background: 'rgba(16,185,129,0.06)',
              border: '1px solid rgba(16,185,129,0.2)',
              borderRadius: '4px'
            }}>
              <Check size={10} color="#10b981" />
              <span style={{ flex: 1, fontSize: m ? '0.65rem' : '0.7rem', fontWeight: 700, color: '#fff' }}>{meal.name}</span>
              <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)' }}>{meal.calories} kcal</span>
              <button onClick={() => onToggle(meal)} style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: 'rgba(255,255,255,0.5)', padding: '0.1rem',
                display: 'flex', alignItems: 'center',
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent'
              }}><X size={10} /></button>
            </div>
          ))}
        </div>
      )}

      {/* Zoekbalk */}
      {(maxSelect > selectedMeals.length || maxSelect === 0) && (
        <>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.35rem',
            padding: '0.4rem 0.6rem',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '6px'
          }}>
            <Search size={12} color="rgba(255,255,255,0.25)" />
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={e => handleSearch(e.target.value)}
              placeholder={`Zoek maaltijd...`}
              style={{
                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                color: '#fff', fontSize: m ? '0.7rem' : '0.75rem',
                fontFamily: 'inherit'
              }}
            />
            {loading && <div style={{ width: '10px', height: '10px', borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.1)', borderTopColor: '#fff', animation: 'spin 0.8s linear infinite' }} />}
          </div>

          {/* Resultaten */}
          <div style={{
            maxHeight: '180px', overflowY: 'auto', WebkitOverflowScrolling: 'touch',
            display: 'flex', flexDirection: 'column', gap: '1px'
          }}>
            {results.filter(r => !isSelected(r)).map(meal => (
              <button key={meal.id} onClick={() => onToggle(meal)} style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.35rem 0.5rem',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.04)',
                borderRadius: '4px', cursor: 'pointer', textAlign: 'left',
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                transition: 'background 0.1s ease', fontFamily: 'inherit'
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: m ? '0.65rem' : '0.7rem', fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{meal.name}</div>
                </div>
                <div style={{ display: 'flex', gap: '0.3rem', flexShrink: 0, alignItems: 'center' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#fff' }}>{meal.calories}</span>
                  <span style={{ fontSize: '0.72rem', color: '#10b981' }}>{Math.round(meal.protein)}E</span>
                </div>
              </button>
            ))}
            {results.filter(r => !isSelected(r)).length === 0 && !loading && (
              <div style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.72rem', color: 'rgba(255,255,255,0.55)' }}>
                {query ? 'Geen resultaten' : 'Geen maaltijden gevonden'}
              </div>
            )}
          </div>
        </>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
