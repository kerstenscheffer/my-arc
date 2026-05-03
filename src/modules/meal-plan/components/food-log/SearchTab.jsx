// src/modules/meal-plan/components/food-log/SearchTab.jsx
// 🎯 v4.0 — Leest amount + per_unit van consumed_meals
// Bij tap op recent: Picker opent op opgeslagen portie met juiste macros
// + knop blijft kopiëren wat er staat (zelfde als laatste log)

import React, { useState, useRef, useEffect } from 'react'
import { Search, Loader, Flame, X, ChevronRight, ShoppingBag, UtensilsCrossed, Plus, Copy } from 'lucide-react'
import FatSecretService from './FatSecretService'

const MODES = [
  { id: 'products', label: 'Producten', icon: ShoppingBag },
  { id: 'meals', label: 'Maaltijden', icon: UtensilsCrossed }
]

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
        const sorted = ingredients.sort((a, b) => {
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
          if (ext.length > 0) setResults(prev => [...prev, ...ext])
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
        meals.forEach(m => {
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

  const accent = '#10b981'
  const isSearching = searched && searchTerm.length >= 2

  return (
    <div>
      <div style={{
        padding: isMobile ? '0.625rem 0.75rem' : '0.75rem 1rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
      }}>
        <div style={{
          display: 'flex', alignItems: 'center',
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '8px',
          padding: isMobile ? '0 0.625rem' : '0 0.75rem',
          gap: '0.5rem'
        }}>
          <Search size={14} color="rgba(255, 255, 255, 0.25)" style={{ flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder={mode === 'products'
              ? 'Zoek product, bijv. "ei", "kipfilet"...'
              : 'Zoek maaltijd, bijv. "kip rijst"...'
            }
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: '#fff', fontSize: isMobile ? '0.85rem' : '0.9rem',
              fontWeight: '500', padding: isMobile ? '0.625rem 0' : '0.75rem 0',
              minHeight: '40px'
            }}
          />
          {searchTerm && (
            <button
              onClick={() => { setSearchTerm(''); setResults([]); setSearched(false) }}
              style={{
                background: 'transparent', border: 'none',
                color: 'rgba(255, 255, 255, 0.3)', cursor: 'pointer',
                padding: '0.25rem', touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <div style={{
        display: 'flex',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
      }}>
        {MODES.map(m => {
          const isActive = mode === m.id
          const Icon = m.icon
          return (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              style={{
                flex: 1, padding: isMobile ? '0.4rem 0' : '0.5rem 0',
                background: 'transparent', border: 'none',
                borderBottom: isActive ? `2px solid ${accent}` : '2px solid transparent',
                color: isActive ? accent : 'rgba(255, 255, 255, 0.3)',
                fontSize: isMobile ? '0.6rem' : '0.65rem',
                fontWeight: isActive ? '700' : '600',
                cursor: 'pointer', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                gap: '0.25rem', touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                transition: 'all 0.15s ease'
              }}
            >
              <Icon size={11} />
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

      {/* SEARCH RESULTS */}
      {!loading && isSearching && results.map((item, idx) => (
        <button
          key={`${item.source}-${item.id}-${idx}`}
          onClick={() => onSelect(item)}
          style={{
            display: 'flex', alignItems: 'center', width: '100%',
            padding: isMobile ? '0.625rem 0.75rem' : '0.75rem 1rem',
            gap: isMobile ? '0.625rem' : '0.75rem',
            background: 'transparent', border: 'none',
            borderBottom: idx < results.length - 1 ? '1px solid rgba(255, 255, 255, 0.04)' : 'none',
            cursor: 'pointer', textAlign: 'left',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            minHeight: '52px', transition: 'background 0.15s ease'
          }}
          onTouchStart={(e) => { if (isMobile) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)' }}
          onTouchEnd={(e) => { if (isMobile) e.currentTarget.style.background = 'transparent' }}
        >
          <ResultIcon item={item} accent={accent} />
          <ResultContent item={item} isMobile={isMobile} accent={accent} />
          <ChevronRight size={14} color="rgba(255, 255, 255, 0.15)" style={{ flexShrink: 0 }} />
        </button>
      ))}

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
                background: 'rgba(16, 185, 129, 0.04)', border: 'none',
                borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                cursor: 'pointer', textAlign: 'left',
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                minHeight: '48px'
              }}
            >
              <div style={{
                width: '28px', height: '28px', borderRadius: '8px',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0
              }}>
                <Copy size={13} color={accent} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: isMobile ? '0.82rem' : '0.9rem', fontWeight: '700', color: accent }}>
                  Kopieer gisteren
                </div>
                <div style={{ fontSize: '0.55rem', color: 'rgba(16, 185, 129, 0.5)' }}>
                  {yesterdayCount} maaltijd{yesterdayCount !== 1 ? 'en' : ''} opnieuw loggen
                </div>
              </div>
              <ChevronRight size={14} color="rgba(16, 185, 129, 0.3)" />
            </button>
          )}

          {recentMeals.length > 0 && (
            <div style={{
              padding: isMobile ? '0.5rem 0.75rem' : '0.625rem 1rem',
              borderBottom: '1px solid rgba(255, 255, 255, 0.04)'
            }}>
              <div style={{
                fontSize: isMobile ? '0.4rem' : '0.45rem',
                fontWeight: '700', color: 'rgba(255, 255, 255, 0.2)',
                textTransform: 'uppercase', letterSpacing: '0.06em'
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

          {!recentsLoading && recentMeals.map((meal, idx) => (
            <div
              key={meal.id || idx}
              style={{
                display: 'flex', alignItems: 'center',
                borderBottom: idx < recentMeals.length - 1
                  ? '1px solid rgba(255, 255, 255, 0.04)' : 'none'
              }}
            >
              <button
                onClick={() => handleSelectRecent(meal)}
                style={{
                  flex: 1, minWidth: 0,
                  display: 'flex', alignItems: 'center',
                  gap: isMobile ? '0.625rem' : '0.75rem',
                  padding: isMobile ? '0.625rem 0.75rem' : '0.75rem 1rem',
                  background: 'transparent', border: 'none',
                  cursor: 'pointer', textAlign: 'left',
                  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                  minHeight: '52px'
                }}
              >
                {meal.count > 1 && (
                  <div style={{
                    width: '22px', height: '22px', borderRadius: '6px',
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, fontSize: '0.55rem', fontWeight: '800', color: accent
                  }}>
                    {meal.count}x
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: isMobile ? '0.82rem' : '0.9rem',
                    fontWeight: '700', color: '#fff',
                    whiteSpace: 'nowrap', overflow: 'hidden',
                    textOverflow: 'ellipsis', letterSpacing: '-0.01em', lineHeight: 1.2
                  }}>
                    {meal.meal_name}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.2rem', alignItems: 'baseline' }}>
                    {[
                      { v: meal.calories, l: 'kcal' },
                      { v: meal.protein, l: 'E' },
                      { v: meal.carbs, l: 'K' },
                      { v: meal.fat, l: 'V' }
                    ].filter(m => m.v > 0).map(m => (
                      <span key={m.l} style={{ fontSize: isMobile ? '0.6rem' : '0.65rem', color: 'rgba(255, 255, 255, 0.35)' }}>
                        <span style={{ fontWeight: '800', color: 'rgba(255, 255, 255, 0.5)' }}>{Math.round(parseFloat(m.v))}</span>
                        <span style={{ fontWeight: '500', fontSize: '0.5rem', marginLeft: '0.05rem' }}>{m.l}</span>
                      </span>
                    ))}
                    {/* Toon portie info */}
                    {meal.amount && meal.per_unit && (
                      <span style={{
                        fontSize: '0.5rem', color: 'rgba(16, 185, 129, 0.4)',
                        fontWeight: '700', marginLeft: '0.25rem'
                      }}>
                        ({meal.amount}{meal.per_unit === 'gram' ? 'g' : meal.amount === 1 ? ' portie' : ' porties'})
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ fontSize: '0.5rem', fontWeight: '600', color: 'rgba(255, 255, 255, 0.15)', flexShrink: 0 }}>
                  {formatTimeAgo(meal.consumed_at)}
                </div>
              </button>

              {onQuickLog && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleQuickLog(meal) }}
                  style={{
                    width: isMobile ? '48px' : '52px',
                    height: '100%', minHeight: '52px', flexShrink: 0,
                    background: 'transparent', border: 'none',
                    borderLeft: '1px solid rgba(255, 255, 255, 0.04)',
                    color: accent, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent'
                  }}
                >
                  <Plus size={16} strokeWidth={2.5} />
                </button>
              )}
            </div>
          ))}

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
  if (item.image_url) {
    return (
      <div style={{
        width: '40px', height: '40px', borderRadius: '8px', flexShrink: 0,
        background: `url(${item.image_url}) center/cover`,
        border: '1px solid rgba(255, 255, 255, 0.06)'
      }} />
    )
  }
  return (
    <div style={{
      width: '40px', height: '40px', borderRadius: '8px', flexShrink: 0,
      background: item.isGeneric ? 'rgba(16, 185, 129, 0.06)' : 'rgba(255, 255, 255, 0.04)',
      border: item.isGeneric ? '1px solid rgba(16, 185, 129, 0.15)' : '1px solid rgba(255, 255, 255, 0.06)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: item.isGeneric ? 'rgba(16, 185, 129, 0.4)' : 'rgba(255, 255, 255, 0.15)'
    }}>
      {item.type === 'meal' ? <UtensilsCrossed size={14} /> : <Flame size={14} />}
    </div>
  )
}

function ResultContent({ item, isMobile, accent }) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
        <span style={{
          fontSize: isMobile ? '0.82rem' : '0.9rem',
          fontWeight: '700', color: '#fff',
          whiteSpace: 'nowrap', overflow: 'hidden',
          textOverflow: 'ellipsis', letterSpacing: '-0.01em',
          flex: 1, minWidth: 0
        }}>
          {item.name}
        </span>
        <span style={{
          fontSize: '0.4rem', fontWeight: '700',
          textTransform: 'uppercase', letterSpacing: '0.05em',
          color: item.isGeneric ? accent
            : item.source === 'fatsecret' ? '#f59e0b'
            : 'rgba(255,255,255,0.25)',
          opacity: 0.7, flexShrink: 0
        }}>
          {item.sourceLabel}
        </span>
      </div>
      {item.brand && (
        <div style={{ fontSize: '0.55rem', color: 'rgba(255, 255, 255, 0.2)', marginTop: '0.05rem' }}>
          {item.brand}
        </div>
      )}
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.2rem' }}>
        {[
          { v: item.calories, l: 'kcal' },
          { v: item.protein, l: 'E' },
          { v: item.carbs, l: 'K' },
          { v: item.fat, l: 'V' }
        ].filter(m => m.v > 0).map(m => (
          <span key={m.l} style={{ fontSize: isMobile ? '0.6rem' : '0.65rem', color: 'rgba(255, 255, 255, 0.35)' }}>
            <span style={{ fontWeight: '800', color: 'rgba(255, 255, 255, 0.5)' }}>{m.v}</span>
            <span style={{ fontWeight: '500', fontSize: '0.45rem', marginLeft: '0.05rem' }}>{m.l}</span>
          </span>
        ))}
        {item.per100g && (
          <span style={{ fontSize: '0.45rem', color: 'rgba(255, 255, 255, 0.15)', fontWeight: '500' }}>/100g</span>
        )}
      </div>
    </div>
  )
}
