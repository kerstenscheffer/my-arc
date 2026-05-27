// src/modules/meal-plan/components/food-log/SearchTab.jsx
// 🎯 v4.0 — Leest amount + per_unit van consumed_meals
// Bij tap op recent: Picker opent op opgeslagen portie met juiste macros
// + knop blijft kopiëren wat er staat (zelfde als laatste log)

import React, { useState, useRef, useEffect } from 'react'
import { Search, Loader, Apple, X, ChevronRight, UtensilsCrossed, Plus, Copy, BadgeCheck } from 'lucide-react'
import FatSecretService from './FatSecretService'

const MODES = [
  { id: 'products', label: 'Alle producten' },
  { id: 'meals',    label: 'Maaltijden' }
]

// Relevance score: lower = better.
// 0  exact match
// 1  starts with query as a whole word ("Meloen geel" for "meloen")
// 2  starts with query as substring  ("Meloensap" for "meloen")
// 3  contains query as a whole word  ("rode meloen" for "meloen")
// 4  contains query anywhere         ("Watermeloen" for "meloen")
// Combined with log_count as a tiebreaker so the base ingredient outranks
// derivatives like *sap / *ijsje / *yoghurt.
const escapeReg = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const computeRelevance = (name, query) => {
  if (!name || !query) return 9
  const n = String(name).toLowerCase().trim()
  const q = String(query).toLowerCase().trim()
  if (!n || !q) return 9
  if (n === q) return 0
  const wb = new RegExp('\\b' + escapeReg(q) + '\\b', 'i')
  const startsAsWord = n === q || wb.test(n.slice(0, q.length + 1)) || n.startsWith(q + ' ') || n.startsWith(q + ',') || n.startsWith(q + '-')
  if (startsAsWord) return 1
  if (n.startsWith(q)) return 2
  if (wb.test(n)) return 3
  if (n.includes(q)) return 4
  return 5
}

export default function SearchTab({ db, onSelect, isMobile, client, onQuickLog, onCopyYesterday, defaultMealMoment }) {
  const [mode, setMode] = useState('products')
  const [searchTerm, setSearchTerm] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [offLoading, setOffLoading] = useState(false)
  const [recentMeals, setRecentMeals] = useState([])
  const [recentsLoading, setRecentsLoading] = useState(true)
  const [yesterdayCount, setYesterdayCount] = useState(0)
  const [fatSecretService] = useState(() => db?.supabase ? new FatSecretService(db.supabase) : null)
  const inputRef = useRef(null)
  const debounceRef = useRef(null)

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 200)
  }, [])

  useEffect(() => {
    if (client?.id) {
      loadRecents()
      checkYesterday()
    } else {
      setRecentsLoading(false)
    }
  }, [client?.id])

  useEffect(() => {
    if (searchTerm && searchTerm.length >= 2) {
      runSearch(searchTerm)
    }
  }, [mode])

  // ── Load recent consumed meals ──
  const loadRecents = async () => {
    setRecentsLoading(true)
    try {
      const { data, error } = await db.supabase
        .from('consumed_meals')
        .select('*')
        .eq('client_id', client.id)
        .order('consumed_at', { ascending: false })
        .limit(50)

      if (error) throw error

      const freqMap = new Map()
      ;(data || []).forEach(meal => {
        const key = (meal.meal_name || '').toLowerCase().trim()
        if (!key) return
        if (freqMap.has(key)) {
          const existing = freqMap.get(key)
          existing.count++
          if (new Date(meal.consumed_at) > new Date(existing.consumed_at)) {
            Object.assign(existing, meal, { count: existing.count })
          }
        } else {
          freqMap.set(key, { ...meal, count: 1 })
        }
      })

      setRecentMeals(Array.from(freqMap.values())
        .sort((a, b) => {
          if (b.count !== a.count) return b.count - a.count
          return new Date(b.consumed_at) - new Date(a.consumed_at)
        }))
    } catch (err) {
      console.error('Failed to load recents:', err)
      setRecentMeals([])
    } finally {
      setRecentsLoading(false)
    }
  }

  const checkYesterday = async () => {
    try {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const dateStr = yesterday.toISOString().split('T')[0]
      const { count, error } = await db.supabase
        .from('consumed_meals')
        .select('id', { count: 'exact', head: true })
        .eq('client_id', client.id)
        .gte('consumed_at', `${dateStr}T00:00:00`)
        .lt('consumed_at', `${dateStr}T23:59:59`)
      if (!error) setYesterdayCount(count || 0)
    } catch { setYesterdayCount(0) }
  }

  const handleSearch = (value) => {
    setSearchTerm(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!value || value.length < 2) {
      setResults([])
      setSearched(false)
      return
    }
    debounceRef.current = setTimeout(() => runSearch(value), 350)
  }

  const runSearch = async (query) => {
    setLoading(true)
    setSearched(true)
    setOffLoading(false)
    try {
      if (mode === 'products') await searchProducts(query)
      else await searchMeals(query)
    } catch (err) {
      console.error('Search failed:', err)
      setResults([])
      setLoading(false)
    }
  }

  // ── PRODUCTEN search ──
  const searchProducts = async (query) => {
    try {
      const { data: ingredients } = await db.supabase
        .from('ai_ingredients')
        .select('id, name, name_en, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, default_portion_gram, category, image_url, brand, log_count, barcode, source')
        .or(`name.ilike.%${query}%,name_en.ilike.%${query}%`)
        .order('log_count', { ascending: false, nullsFirst: false })
        .limit(20)

      const allResults = []
      if (ingredients) {
        // Sort priority:
        //   1. Relevance (exact > starts-as-word > starts > word-boundary > contains)
        //   2. Generic items (no barcode / manual source) over branded variants
        //   3. log_count desc (popular items first within same relevance bucket)
        const sorted = ingredients.sort((a, b) => {
          const rA = computeRelevance(a.name, query)
          const rB = computeRelevance(b.name, query)
          if (rA !== rB) return rA - rB
          const aGen = !a.barcode || a.source === 'manual' ? 1 : 0
          const bGen = !b.barcode || b.source === 'manual' ? 1 : 0
          if (aGen !== bGen) return bGen - aGen
          return (b.log_count || 0) - (a.log_count || 0)
        })
        sorted.forEach(ing => allResults.push({
          id: ing.id, name: ing.name, brand: ing.brand || null,
          calories: Math.round(ing.calories_per_100g || 0),
          protein: Math.round(ing.protein_per_100g || 0),
          carbs: Math.round(ing.carbs_per_100g || 0),
          fat: Math.round(ing.fat_per_100g || 0),
          defaultPortion: ing.default_portion_gram || 100,
          category: ing.category, image_url: ing.image_url,
          type: 'ingredient', source: 'myarc',
          sourceLabel: ing.barcode ? 'Product' : 'Basis',
          per100g: true, isGeneric: !ing.barcode
        }))
      }
      setResults(allResults)
      setLoading(false)

      setOffLoading(true)
      try {
        if (fatSecretService) {
          const fsResults = await fatSecretService.searchFood(query, 8)
          const ext = []
          fsResults.forEach(f => {
            if (!f.name) return
            if (allResults.some(r => r.name.toLowerCase() === f.name.toLowerCase())) return
            ext.push({
              id: f.id || f.externalId, name: f.name, brand: f.brand || null,
              calories: f.calories || 0, protein: f.protein || 0,
              carbs: f.carbs || 0, fat: f.fat || 0,
              type: f.type || 'product', source: 'fatsecret',
              sourceLabel: 'Online', per100g: f.per100g || false,
              externalId: f.externalId || f.id
            })
          })
          if (ext.length > 0) {
            // Merge + re-sort by relevance so an exact-match FatSecret item
            // can outrank myarc derivatives. myarc keeps a tie-break edge
            // through log_count when relevance is equal.
            setResults(prev => {
              const combined = [...prev, ...ext]
              combined.sort((a, b) => {
                const rA = computeRelevance(a.name, query)
                const rB = computeRelevance(b.name, query)
                if (rA !== rB) return rA - rB
                const aMyarc = a.source === 'myarc' ? 0 : 1
                const bMyarc = b.source === 'myarc' ? 0 : 1
                if (aMyarc !== bMyarc) return aMyarc - bMyarc
                return 0
              })
              return combined
            })
          }
        }
      } catch {} finally { setOffLoading(false) }
    } catch (err) {
      console.error('Product search failed:', err)
      setResults([])
      setLoading(false)
    }
  }

  // ── MAALTIJDEN search ──
  const searchMeals = async (query) => {
    try {
      const { data: meals } = await db.supabase
        .from('ai_meals')
        .select('id, name, name_en, calories, protein, carbs, fat, image_url, timing')
        .or(`name.ilike.%${query}%,name_en.ilike.%${query}%`)
        .limit(20)

      const allResults = []
      if (meals) {
        // Sort by relevance so exact "rijst" outranks "rijst-yoghurt-bowl" etc.
        const sortedMeals = meals.slice().sort((a, b) => {
          const rA = computeRelevance(a.name, query)
          const rB = computeRelevance(b.name, query)
          return rA - rB
        })
        sortedMeals.forEach(m => {
          let timingLabel = ''
          try {
            const t = Array.isArray(m.timing) ? m.timing : JSON.parse(m.timing || '[]')
            const map = { breakfast: 'Ontbijt', lunch: 'Lunch', dinner: 'Diner', snack: 'Snack' }
            timingLabel = t.map(s => map[s] || s).join(', ')
          } catch {}
          allResults.push({
            id: m.id, name: m.name,
            calories: Math.round(m.calories || 0), protein: Math.round(m.protein || 0),
            carbs: Math.round(m.carbs || 0), fat: Math.round(m.fat || 0),
            image_url: m.image_url, type: 'meal', source: 'myarc',
            sourceLabel: timingLabel || 'Gerecht', per100g: false
          })
        })
      }
      setResults(allResults)
      setLoading(false)
    } catch (err) {
      console.error('Meal search failed:', err)
      setResults([])
      setLoading(false)
    }
  }

  // ─────────────────────────────────────────────
  // + KNOP — kopieert exact wat er staat (zelfde portie, zelfde macros)
  // ─────────────────────────────────────────────
  const handleQuickLog = (meal) => {
    if (!onQuickLog) return

    onQuickLog({
      name: meal.meal_name,
      sourceId: meal.meal_id,
      type: meal.meal_type || 'recent_log',
      calories: meal.calories || 0,
      protein: parseFloat(meal.protein) || 0,
      carbs: parseFloat(meal.carbs) || 0,
      fat: parseFloat(meal.fat) || 0,
      ingredients: meal.ingredients || [],
      source: 'recent_relog',
      image_url: meal.image_url,
      meal_type: defaultMealMoment || meal.meal_type || 'snack',
      // 🎯 Geef opgeslagen portie info door zodat re-log dezelfde data heeft
      amount: meal.amount,
      per_unit: meal.per_unit,
      per100g: meal.per_unit === 'gram'
    })
  }

  // ─────────────────────────────────────────────
  // TAP op recent — opent AmountPicker met opgeslagen portie
  // ─────────────────────────────────────────────
  const handleSelectRecent = (meal) => {
    // Bepaal of dit een per100g of per-portie item is
    const isPer100g = meal.per_unit === 'gram'

    onSelect({
      id: meal.meal_id || meal.id,
      name: meal.meal_name,
      calories: meal.calories || 0,
      protein: parseFloat(meal.protein) || 0,
      carbs: parseFloat(meal.carbs) || 0,
      fat: parseFloat(meal.fat) || 0,
      image_url: meal.image_url,
      ingredients: meal.ingredients || [],
      type: 'recent',
      source: 'recent',
      per100g: isPer100g,
      // 🎯 Picker gebruikt deze om op de juiste portie te openen + lineair te schalen
      _savedAmount: meal.amount,
      _savedPerUnit: meal.per_unit
    })
  }

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return ''
    const diff = Date.now() - new Date(dateStr).getTime()
    const hours = Math.floor(diff / 3600000)
    if (hours < 1) return 'Net'
    if (hours < 24) return `${hours}u`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days}d`
    return `${Math.floor(days / 7)}w`
  }

  const accent = '#FFD700'
  const isSearching = searched && searchTerm.length >= 2

  return (
    <div>
      {/* ── Big inviting search bar ── */}
      <div style={{ padding: isMobile ? '0.875rem 1rem 0.5rem' : '1rem 1.25rem 0.625rem' }}>
        <div style={{
          display: 'flex', alignItems: 'center',
          background: 'rgba(255, 255, 255, 0.06)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          padding: isMobile ? '0 0.875rem' : '0 1rem',
          gap: '0.625rem',
          minHeight: isMobile ? '46px' : '50px',
        }}>
          <Search size={18} color="rgba(255, 255, 255, 0.4)" strokeWidth={2.2} style={{ flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder={mode === 'products' ? 'Zoek producten' : 'Zoek maaltijden'}
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: '#fff', fontSize: isMobile ? '0.95rem' : '1rem',
              fontWeight: '500', padding: 0,
              minHeight: isMobile ? '46px' : '50px'
            }}
          />
          {searchTerm && (
            <button
              onClick={() => { setSearchTerm(''); setResults([]); setSearched(false) }}
              style={{
                background: 'rgba(255,255,255,0.08)', border: 'none',
                color: 'rgba(255, 255, 255, 0.6)', cursor: 'pointer',
                width: '22px', height: '22px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
              aria-label="Wissen"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* ── Filter chip pills ── */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        padding: isMobile ? '0.25rem 1rem 0.875rem' : '0.375rem 1.25rem 1rem',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
      }}>
        {MODES.map(m => {
          const isActive = mode === m.id
          return (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              style={{
                padding: isMobile ? '0.5rem 1rem' : '0.55rem 1.125rem',
                background: isActive ? accent : 'rgba(255, 255, 255, 0.06)',
                border: isActive ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '999px',
                color: isActive ? '#000' : 'rgba(255, 255, 255, 0.65)',
                fontSize: isMobile ? '0.8rem' : '0.85rem',
                fontWeight: isActive ? '800' : '600',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                transition: 'all 0.15s ease',
                minHeight: '36px',
                flexShrink: 0,
              }}
            >
              {m.label}
            </button>
          )
        })}
      </div>

      {loading && (
        <div style={{
          padding: '2rem', textAlign: 'center',
          color: 'rgba(255, 255, 255, 0.2)', fontSize: '0.8rem'
        }}>
          <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* SEARCH RESULTS — large card style */}
      {!loading && isSearching && (
        <div style={{
          padding: isMobile ? '0 1rem 1rem' : '0 1.25rem 1.25rem',
          display: 'flex', flexDirection: 'column', gap: '0.5rem'
        }}>
          {results.map((item, idx) => (
            <button
              key={`${item.source}-${item.id}-${idx}`}
              onClick={() => onSelect(item)}
              style={{
                display: 'flex', alignItems: 'center', width: '100%',
                padding: isMobile ? '0.75rem' : '0.875rem',
                gap: '0.875rem',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '14px',
                cursor: 'pointer', textAlign: 'left',
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                minHeight: '76px', transition: 'background 0.15s ease'
              }}
              onTouchStart={(e) => { if (isMobile) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.07)' }}
              onTouchEnd={(e) => { if (isMobile) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)' }}
            >
              <ResultIcon item={item} accent={accent} />
              <ResultContent item={item} isMobile={isMobile} accent={accent} />
            </button>
          ))}
        </div>
      )}

      {offLoading && (
        <div style={{
          padding: '0.625rem 1rem', borderTop: '1px solid rgba(255, 255, 255, 0.04)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: '0.375rem', color: 'rgba(245, 158, 11, 0.4)',
          fontSize: '0.6rem', fontWeight: '600'
        }}>
          <Loader size={11} style={{ animation: 'spin 1s linear infinite' }} />
          Online producten laden...
        </div>
      )}

      {!loading && isSearching && results.length === 0 && (
        <div style={{
          padding: '2.5rem 1rem', textAlign: 'center',
          color: 'rgba(255, 255, 255, 0.2)', fontSize: '0.75rem'
        }}>
          Geen {mode === 'products' ? 'producten' : 'maaltijden'} voor "{searchTerm}"
        </div>
      )}

      {/* RECENTS */}
      {!loading && !isSearching && (
        <>
          {yesterdayCount > 0 && onCopyYesterday && (
            <button
              onClick={onCopyYesterday}
              style={{
                display: 'flex', alignItems: 'center',
                gap: '0.5rem', width: '100%',
                padding: isMobile ? '0.625rem 0.75rem' : '0.75rem 1rem',
                background: 'rgba(255, 215, 0, 0.04)', border: 'none',
                borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                cursor: 'pointer', textAlign: 'left',
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                minHeight: '48px'
              }}
            >
              <div style={{
                width: '28px', height: '28px', borderRadius: '8px',
                background: 'rgba(255, 215, 0, 0.1)',
                border: '1px solid rgba(255, 215, 0, 0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0
              }}>
                <Copy size={13} color={accent} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: isMobile ? '0.82rem' : '0.9rem', fontWeight: '700', color: accent }}>
                  Kopieer gisteren
                </div>
                <div style={{ fontSize: '0.55rem', color: 'rgba(255, 215, 0, 0.5)' }}>
                  {yesterdayCount} maaltijd{yesterdayCount !== 1 ? 'en' : ''} opnieuw loggen
                </div>
              </div>
              <ChevronRight size={14} color="rgba(255, 215, 0, 0.3)" />
            </button>
          )}

          {recentMeals.length > 0 && (
            <div style={{
              padding: isMobile ? '0.625rem 1rem 0.5rem' : '0.75rem 1.25rem 0.625rem',
            }}>
              <div style={{
                fontSize: isMobile ? '0.7rem' : '0.75rem',
                fontWeight: '700', color: 'rgba(255, 255, 255, 0.45)',
                textTransform: 'uppercase', letterSpacing: '0.08em'
              }}>
                Recent gelogd
              </div>
            </div>
          )}

          {recentsLoading && (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255, 255, 255, 0.2)', fontSize: '0.8rem' }}>
              Laden...
            </div>
          )}

          {!recentsLoading && recentMeals.length > 0 && (
            <div style={{
              padding: isMobile ? '0 1rem 1rem' : '0 1.25rem 1.25rem',
              display: 'flex', flexDirection: 'column', gap: '0.5rem'
            }}>
              {recentMeals.map((meal, idx) => {
                const portionTxt = meal.amount && meal.per_unit
                  ? `${meal.amount}${meal.per_unit === 'gram' ? 'g' : meal.amount === 1 ? ' portie' : ' porties'}`
                  : ''
                return (
                  <div
                    key={meal.id || idx}
                    style={{
                      display: 'flex', alignItems: 'stretch',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      borderRadius: '14px',
                      overflow: 'hidden',
                    }}
                  >
                    <button
                      onClick={() => handleSelectRecent(meal)}
                      style={{
                        flex: 1, minWidth: 0,
                        display: 'flex', alignItems: 'center',
                        gap: '0.875rem',
                        padding: isMobile ? '0.75rem' : '0.875rem',
                        background: 'transparent', border: 'none',
                        cursor: 'pointer', textAlign: 'left',
                        touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                        minHeight: '76px'
                      }}
                    >
                      {/* Image / placeholder + count badge overlay */}
                      <div style={{ position: 'relative', flexShrink: 0 }}>
                        {meal.image_url ? (
                          <div style={{
                            width: '56px', height: '56px', borderRadius: '12px',
                            background: `url(${meal.image_url}) center/cover, #fff`,
                            border: '1px solid rgba(255, 255, 255, 0.08)'
                          }} />
                        ) : (
                          <div style={{
                            width: '56px', height: '56px', borderRadius: '12px',
                            background: 'rgba(255, 215, 0, 0.06)',
                            border: '1px solid rgba(255, 215, 0, 0.15)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'rgba(255, 215, 0, 0.55)'
                          }}>
                            <Apple size={24} strokeWidth={1.8} />
                          </div>
                        )}
                        {meal.count > 1 && (
                          <div style={{
                            position: 'absolute', top: '-4px', right: '-4px',
                            minWidth: '22px', height: '22px', padding: '0 4px',
                            borderRadius: '11px',
                            background: accent,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.65rem', fontWeight: '800', color: '#000',
                            border: '2px solid #0a0a0a',
                          }}>
                            {meal.count}×
                          </div>
                        )}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: isMobile ? '0.95rem' : '1rem',
                          fontWeight: '700', color: '#fff',
                          whiteSpace: 'nowrap', overflow: 'hidden',
                          textOverflow: 'ellipsis', letterSpacing: '-0.01em',
                          lineHeight: 1.3, marginBottom: '0.25rem',
                        }}>
                          {meal.meal_name}
                        </div>
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: '0.4rem',
                          fontSize: isMobile ? '0.78rem' : '0.85rem',
                          color: 'rgba(255, 255, 255, 0.45)', fontWeight: '500',
                          whiteSpace: 'nowrap', overflow: 'hidden',
                        }}>
                          <span style={{ color: accent, fontWeight: '700' }}>
                            {Math.round(meal.calories || 0)} kcal
                          </span>
                          {portionTxt && (
                            <>
                              <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
                              <span>{portionTxt}</span>
                            </>
                          )}
                          <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
                          <span>{formatTimeAgo(meal.consumed_at)}</span>
                        </div>
                      </div>
                    </button>

                    {onQuickLog && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleQuickLog(meal) }}
                        aria-label="Snel loggen"
                        style={{
                          width: isMobile ? '52px' : '56px',
                          flexShrink: 0,
                          background: 'rgba(255, 215, 0, 0.08)',
                          border: 'none',
                          borderLeft: '1px solid rgba(255, 215, 0, 0.12)',
                          color: accent, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent'
                        }}
                      >
                        <Plus size={20} strokeWidth={2.5} />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {!recentsLoading && recentMeals.length === 0 && (
            <div style={{
              padding: '2.5rem 1rem', textAlign: 'center',
              color: 'rgba(255, 255, 255, 0.15)', fontSize: '0.7rem'
            }}>
              Zoek op productnaam, bijv. "ei", "kipfilet", "havermout"
            </div>
          )}
        </>
      )}
    </div>
  )
}

function ResultIcon({ item, accent }) {
  // 56x56 rounded square — bigger, more visual presence (Food-app style).
  // Verified-badge overlay for items in our own DB (basis ingredients,
  // myarc products) — distinguishes them from external (FatSecret) items.
  const isVerified = item.source === 'myarc'
  const verifyColor = item.isGeneric ? accent : '#3b82f6'

  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      {item.image_url ? (
        <div style={{
          width: '56px', height: '56px', borderRadius: '12px',
          background: `url(${item.image_url}) center/cover, #fff`,
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }} />
      ) : (
        <div style={{
          width: '56px', height: '56px', borderRadius: '12px',
          background: 'rgba(255, 215, 0, 0.06)',
          border: '1px solid rgba(255, 215, 0, 0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'rgba(255, 215, 0, 0.55)'
        }}>
          {item.type === 'meal'
            ? <UtensilsCrossed size={22} strokeWidth={1.8} />
            : <Apple size={24} strokeWidth={1.8} />}
        </div>
      )}
      {isVerified && (
        <div style={{
          position: 'absolute', bottom: '-2px', right: '-2px',
          width: '18px', height: '18px', borderRadius: '50%',
          background: '#000',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '2px solid #0a0a0a',
        }}>
          <BadgeCheck size={16} color={verifyColor} fill={verifyColor === accent ? accent : '#3b82f6'} strokeWidth={0} />
          <BadgeCheck size={16} color="#000" strokeWidth={2} style={{ position: 'absolute' }} />
        </div>
      )}
    </div>
  )
}

function ResultContent({ item, isMobile, accent }) {
  // Simple 2-line hierarchy (Food-app style):
  //   line 1: bold name
  //   line 2: gold kcal · portion/source description
  const portionLabel = item.per100g
    ? '/100g'
    : item.defaultPortion
      ? `${item.defaultPortion}g`
      : item.sourceLabel || ''

  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{
        fontSize: isMobile ? '0.95rem' : '1rem',
        fontWeight: '700', color: '#fff',
        whiteSpace: 'nowrap', overflow: 'hidden',
        textOverflow: 'ellipsis', letterSpacing: '-0.01em',
        lineHeight: 1.3,
        marginBottom: '0.25rem',
      }}>
        {item.name}
      </div>
      <div style={{
        display: 'flex', alignItems: 'center',
        gap: '0.4rem',
        fontSize: isMobile ? '0.78rem' : '0.85rem',
        color: 'rgba(255, 255, 255, 0.45)',
        fontWeight: '500',
      }}>
        <span style={{ color: accent, fontWeight: '700' }}>
          {item.calories} kcal
        </span>
        {portionLabel && (
          <>
            <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
            <span style={{
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              minWidth: 0,
            }}>
              {portionLabel}{item.brand ? ` · ${item.brand}` : ''}
            </span>
          </>
        )}
      </div>
    </div>
  )
}
