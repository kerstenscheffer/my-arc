// src/modules/ai-meal-generator/tabs/plan-analyzer/SwapModal.jsx
// v3.0 — Label filters + fuzzy search via pg_trgm

import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X, Search, ChevronRight, Zap, Calendar } from 'lucide-react'

const DAYS_SHORT = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo']

// Gefilterde label groepen voor SwapModal — meest relevante voor zoeken
const FILTER_GROUPS = [
  {
    label: 'Doel', color: '#FFD700',
    options: ['bulk_friendly', 'cut_friendly', 'high_protein', 'low_calorie', 'low_cal', 'high_calorie', 'calorie_dense', 'lean', 'muscle_gain']
  },
  {
    label: 'Macro', color: '#10b981',
    options: ['high_carb', 'low_carb', 'high_fat', 'low_fat', 'high_fiber', 'keto_friendly', 'whole_grain']
  },
  {
    label: 'Dieet', color: '#6366f1',
    options: ['vegetarian', 'vegan', 'gluten_free', 'plant_based', 'clean', 'whole_food']
  },
  {
    label: 'Timing', color: '#f97316',
    options: ['pre_workout', 'post_workout', 'before_bed', 'quick', 'meal_prep', 'no_cook']
  },
]

export default function SwapModal({
  db, slot, currentMeal, dayIndex, dayTotals, targets,
  onSelect, onMultiDaySelect, onClose, isMobile
}) {
  const [meals, setMeals]               = useState([])
  const [search, setSearch]             = useState('')
  const [loading, setLoading]           = useState(true)
  const [selectedMeal, setSelectedMeal] = useState(null)
  const [showDayPicker, setShowDayPicker] = useState(false)
  const [selectedDays, setSelectedDays] = useState([dayIndex])
  const [activeLabels, setActiveLabels] = useState([])
  const [showFilters, setShowFilters]   = useState(false)
  const debounceRef = useRef(null)
  const m = isMobile

  // Laad suggesties bij mount en bij label filter wijziging
  useEffect(() => {
    if (!search.trim()) loadSuggestions()
  }, [activeLabels])

  useEffect(() => { loadSuggestions() }, [])

  // Debounce zoeken
  useEffect(() => {
    if (!search.trim()) { loadSuggestions(); return }
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => loadSearch(search), 300)
  }, [search])

  // ── Initiële suggesties op timing + label filters ──
  const loadSuggestions = async () => {
    setLoading(true)
    try {
      const timingMap = { breakfast: 'breakfast', lunch: 'lunch', dinner: 'dinner', snack1: 'snack', snack2: 'snack', snack3: 'snack' }
      const timing = timingMap[slot] || 'snack'

      let query = db.supabase
        .from('ai_meals')
        .select('id, name, internal_name, calories, protein, carbs, fat, image_url, timing, labels, ingredients_list, difficulty, cost_tier')
        .contains('timing', [timing])
        .limit(80)

      // Label filters
      if (activeLabels.length > 0) {
        query = query.contains('labels', activeLabels)
      }

      const { data } = await query
      setMeals(scoreAndSort(data || []))
    } catch (e) { console.warn('SwapModal suggestions failed:', e) }
    setLoading(false)
  }

  // ── Fuzzy search via pg_trgm RPC ──
  const loadSearch = async (q) => {
    setLoading(true)
    try {
      // Probeer fuzzy search via RPC
      const { data, error } = await db.supabase.rpc('search_meals_fuzzy', {
        search_term: q,
        label_filter: activeLabels.length > 0 ? activeLabels : null,
        result_limit: 50
      })

      if (error) {
        // Fallback: ILIKE op name + internal_name als RPC niet bestaat
        const { data: fallback } = await db.supabase
          .from('ai_meals')
          .select('id, name, internal_name, calories, protein, carbs, fat, image_url, timing, labels, ingredients_list, difficulty, cost_tier')
          .or(`name.ilike.%${q}%,internal_name.ilike.%${q}%`)
          .limit(50)
        setMeals(scoreAndSort(fallback || []))
      } else {
        setMeals(scoreAndSort(data || []))
      }
    } catch (e) {
      console.warn('SwapModal search failed:', e)
    }
    setLoading(false)
  }

  // ── Fit score ──
  const scoreAndSort = (data) => {
    const cal  = dayTotals?.kcal || dayTotals?.calories || 0
    const prot = dayTotals?.protein || 0
    const currentCal  = currentMeal?.calories || 0
    const currentProt = currentMeal?.protein  || 0
    const needCal  = (targets?.calories || 2500) - cal  + currentCal
    const needProt = (targets?.protein  || 150)  - prot + currentProt

    return data
      .map(meal => {
        const calDiff  = Math.abs((meal.calories || 0) - needCal)
        const protDiff = Math.abs((meal.protein  || 0) - needProt)
        return { ...meal, fitScore: Math.max(0, Math.round(100 - calDiff / 20 - protDiff / 5)) }
      })
      .sort((a, b) => b.fitScore - a.fitScore)
  }

  const toggleLabel = (label) => {
    setActiveLabels(prev => prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label])
  }

  const handleMealSelect = (meal) => { setSelectedMeal(meal); setShowDayPicker(true) }
  const toggleDay = (i) => setSelectedDays(prev => prev.includes(i) ? prev.filter(d => d !== i) : [...prev, i])

  const applySelection = () => {
    if (!selectedMeal) return
    if (selectedDays.length === 1 && selectedDays[0] === dayIndex) onSelect(selectedMeal)
    else onMultiDaySelect(selectedMeal, slot, selectedDays)
  }

  const modal = (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)',
      zIndex: 10000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center'
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#0a0a0a', borderRadius: '16px 16px 0 0',
        width: '100%', maxWidth: '580px', maxHeight: '90vh',
        display: 'flex', flexDirection: 'column', overflow: 'hidden'
      }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: m ? '0.625rem 0.75rem' : '0.75rem 1rem',
          borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0
        }}>
          <div>
            <div style={{ fontSize: m ? '0.85rem' : '0.95rem', fontWeight: 800, color: '#fff' }}>
              {showDayPicker ? 'Toepassen op dagen' : 'Vervang maaltijd'}
            </div>
            <div style={{ fontSize: m ? '0.5rem' : '0.55rem', color: 'rgba(255,255,255,0.3)' }}>
              {showDayPicker
                ? `${selectedMeal?.name} → selecteer dagen`
                : `${currentMeal?.name || 'Leeg slot'} → kies alternatief`}
            </div>
          </div>
          <button onClick={onClose} style={{
            width: '32px', height: '32px', borderRadius: '6px',
            background: 'transparent', border: '1px solid rgba(255,255,255,0.06)',
            color: 'rgba(255,255,255,0.3)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent'
          }}><X size={16} /></button>
        </div>

        {/* ═══ DAY PICKER ═══ */}
        {showDayPicker ? (
          <div style={{ padding: m ? '0.75rem' : '1rem', overflowY: 'auto' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.5rem 0.625rem', marginBottom: '0.75rem',
              background: 'rgba(255,215,0,0.04)', border: '1px solid rgba(255,215,0,0.15)', borderRadius: '6px'
            }}>
              {selectedMeal?.image_url && (
                <div style={{ width: '40px', height: '32px', borderRadius: '3px', backgroundImage: `url(${selectedMeal.image_url})`, backgroundSize: 'cover', backgroundPosition: 'center', flexShrink: 0 }} />
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: m ? '0.75rem' : '0.8rem', fontWeight: 700, color: '#fff' }}>{selectedMeal?.name}</div>
                <div style={{ fontSize: m ? '0.5rem' : '0.55rem', color: 'rgba(255,255,255,0.3)' }}>
                  {Math.round(selectedMeal?.calories || 0)} kcal · {Math.round(selectedMeal?.protein || 0)}g E
                </div>
              </div>
            </div>

            <div style={{ fontSize: m ? '0.4rem' : '0.45rem', fontWeight: 700, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.35rem' }}>
              WELKE DAGEN?
            </div>
            <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.5rem' }}>
              {DAYS_SHORT.map((day, i) => (
                <button key={i} onClick={() => toggleDay(i)} style={{
                  flex: 1, padding: m ? '0.5rem 0' : '0.6rem 0',
                  background: selectedDays.includes(i) ? 'rgba(255,215,0,0.08)' : 'transparent',
                  border: `1px solid ${selectedDays.includes(i) ? 'rgba(255,215,0,0.3)' : 'rgba(255,255,255,0.06)'}`,
                  borderRadius: '6px',
                  color: selectedDays.includes(i) ? '#FFD700' : 'rgba(255,255,255,0.3)',
                  fontSize: m ? '0.6rem' : '0.65rem', fontWeight: selectedDays.includes(i) ? 800 : 600,
                  cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minHeight: '36px'
                }}>{day}</button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.75rem' }}>
              <QuickBtn label="Alleen vandaag" active={selectedDays.length === 1 && selectedDays[0] === dayIndex} onClick={() => setSelectedDays([dayIndex])} m={m} />
              <QuickBtn label="Alle dagen"     active={selectedDays.length === 7}                                 onClick={() => setSelectedDays([0,1,2,3,4,5,6])} m={m} />
              <QuickBtn label="Werkdagen"      active={selectedDays.length === 5 && !selectedDays.includes(5)}   onClick={() => setSelectedDays([0,1,2,3,4])} m={m} />
            </div>
            <button onClick={applySelection} disabled={selectedDays.length === 0} style={{
              width: '100%', padding: m ? '0.625rem' : '0.75rem',
              background: selectedDays.length === 0 ? 'rgba(255,255,255,0.05)' : '#FFD700',
              border: 'none', borderRadius: '6px',
              color: selectedDays.length === 0 ? 'rgba(255,255,255,0.2)' : '#000',
              fontSize: m ? '0.75rem' : '0.85rem', fontWeight: 800,
              cursor: selectedDays.length === 0 ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem',
              minHeight: '44px', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent'
            }}>
              <Calendar size={15} />
              Toepassen op {selectedDays.length} dag{selectedDays.length !== 1 ? 'en' : ''}
            </button>
            <button onClick={() => { setShowDayPicker(false); setSelectedMeal(null) }} style={{
              width: '100%', padding: '0.5rem', marginTop: '0.35rem',
              background: 'transparent', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '6px', color: 'rgba(255,255,255,0.3)',
              fontSize: m ? '0.6rem' : '0.65rem', fontWeight: 600, cursor: 'pointer',
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent'
            }}>← Andere maaltijd kiezen</button>
          </div>

        ) : (
          <>
            {/* ═══ ZOEK + FILTERS ═══ */}
            <div style={{ flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              {/* Zoekbalk */}
              <div style={{ padding: m ? '0.5rem 0.75rem 0.35rem' : '0.5rem 1rem 0.35rem' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                  padding: '0.5rem 0.625rem', background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)', borderRadius: '6px'
                }}>
                  <Search size={14} color="rgba(255,255,255,0.2)" />
                  <input
                    value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Zoek op naam of coach naam..."
                    autoFocus
                    style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: m ? '0.8rem' : '0.85rem', fontFamily: 'inherit' }}
                  />
                  {loading && <div style={{ width: '10px', height: '10px', borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.1)', borderTopColor: '#FFD700', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />}
                </div>
              </div>

              {/* Filter toggle */}
              <button onClick={() => setShowFilters(!showFilters)} style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: m ? '0.25rem 0.75rem' : '0.3rem 1rem',
                background: 'transparent', border: 'none', cursor: 'pointer',
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ fontSize: '0.45rem', fontWeight: 700, color: activeLabels.length > 0 ? '#FFD700' : 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    FILTERS {activeLabels.length > 0 ? `(${activeLabels.length})` : ''}
                  </span>
                  {activeLabels.map(l => (
                    <span key={l} style={{ fontSize: '0.38rem', fontWeight: 700, color: '#FFD700', background: 'rgba(255,215,0,0.1)', padding: '0.05rem 0.25rem', borderRadius: '2px' }}>
                      {l.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
                <span style={{ fontSize: '0.45rem', color: 'rgba(255,255,255,0.2)' }}>{showFilters ? '▲' : '▼'}</span>
              </button>

              {/* Filter panels */}
              {showFilters && (
                <div style={{ padding: m ? '0.25rem 0.75rem 0.5rem' : '0.25rem 1rem 0.5rem' }}>
                  {FILTER_GROUPS.map(group => (
                    <div key={group.label} style={{ marginBottom: '0.35rem' }}>
                      <div style={{ fontSize: '0.38rem', fontWeight: 700, color: group.color, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.15rem', opacity: 0.6 }}>
                        {group.label}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.2rem' }}>
                        {group.options.map(opt => {
                          const active = activeLabels.includes(opt)
                          return (
                            <button key={opt} onClick={() => toggleLabel(opt)} style={{
                              padding: '0.12rem 0.35rem',
                              background: active ? `${group.color}18` : 'rgba(255,255,255,0.03)',
                              border: `1px solid ${active ? group.color + '50' : 'rgba(255,255,255,0.06)'}`,
                              borderRadius: '3px',
                              color: active ? group.color : 'rgba(255,255,255,0.3)',
                              fontSize: m ? '0.48rem' : '0.52rem', fontWeight: active ? 700 : 500,
                              cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                              transition: 'all 0.1s ease', fontFamily: 'inherit'
                            }}>
                              {opt.replace(/_/g, ' ')}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                  {activeLabels.length > 0 && (
                    <button onClick={() => setActiveLabels([])} style={{
                      marginTop: '0.25rem', padding: '0.2rem 0.5rem',
                      background: 'transparent', border: '1px solid rgba(239,68,68,0.2)',
                      borderRadius: '3px', color: '#ef4444',
                      fontSize: '0.45rem', fontWeight: 700, cursor: 'pointer',
                      touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', fontFamily: 'inherit'
                    }}>
                      × Filters wissen
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* ═══ RESULTATEN ═══ */}
            <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
              {!loading && meals.length === 0 && (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '0.7rem' }}>
                  Geen maaltijden gevonden
                </div>
              )}
              {meals.map(meal => (
                <button key={meal.id} onClick={() => handleMealSelect(meal)} style={{
                  width: '100%', display: 'flex', gap: '0.5rem',
                  padding: m ? '0.5rem 0.75rem' : '0.625rem 1rem',
                  background: 'transparent', border: 'none',
                  borderBottom: '1px solid rgba(255,255,255,0.03)',
                  cursor: 'pointer', textAlign: 'left',
                  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                  alignItems: 'center'
                }}>
                  {meal.image_url && (
                    <div style={{ width: '48px', height: '40px', borderRadius: '4px', backgroundImage: `url(${meal.image_url})`, backgroundSize: 'cover', backgroundPosition: 'center', flexShrink: 0 }} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: m ? '0.75rem' : '0.8rem', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '0.05rem' }}>
                      {meal.name}
                    </div>
                    {meal.internal_name && (
                      <div style={{ fontSize: '0.4rem', fontWeight: 600, color: 'rgba(255,215,0,0.4)', marginBottom: '0.1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        🔒 {meal.internal_name}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '0.35rem', fontSize: m ? '0.5rem' : '0.55rem' }}>
                      <span style={{ fontWeight: 800, color: '#FFD700' }}>{Math.round(meal.calories)} kcal</span>
                      <span style={{ fontWeight: 700, color: '#10b981' }}>{Math.round(meal.protein)}g E</span>
                      <span style={{ color: 'rgba(255,255,255,0.25)' }}>{Math.round(meal.carbs)}g K</span>
                      <span style={{ color: 'rgba(255,255,255,0.25)' }}>{Math.round(meal.fat)}g V</span>
                    </div>
                  </div>
                  {meal.fitScore > 0 && !search && (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '0.15rem',
                      padding: '0.15rem 0.35rem',
                      background: meal.fitScore >= 70 ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${meal.fitScore >= 70 ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.06)'}`,
                      borderRadius: '3px', flexShrink: 0
                    }}>
                      <Zap size={9} color={meal.fitScore >= 70 ? '#10b981' : 'rgba(255,255,255,0.25)'} />
                      <span style={{ fontSize: '0.5rem', fontWeight: 800, color: meal.fitScore >= 70 ? '#10b981' : 'rgba(255,255,255,0.3)' }}>{meal.fitScore}</span>
                    </div>
                  )}
                  <ChevronRight size={12} color="rgba(255,255,255,0.1)" style={{ flexShrink: 0 }} />
                </button>
              ))}
            </div>
          </>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  return createPortal(modal, document.body)
}

function QuickBtn({ label, active, onClick, m }) {
  return (
    <button onClick={onClick} style={{
      flex: 1, padding: m ? '0.35rem 0' : '0.4rem 0',
      background: active ? 'rgba(255,215,0,0.06)' : 'transparent',
      border: `1px solid ${active ? 'rgba(255,215,0,0.2)' : 'rgba(255,255,255,0.06)'}`,
      borderRadius: '3px', color: active ? '#FFD700' : 'rgba(255,255,255,0.25)',
      fontSize: m ? '0.5rem' : '0.55rem', fontWeight: 700,
      cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent'
    }}>{label}</button>
  )
}
