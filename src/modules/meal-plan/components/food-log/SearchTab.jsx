// src/modules/meal-plan/components/food-log/SearchTab.jsx
// 🎯 v4.0 — Leest amount + per_unit van consumed_meals
// Bij tap op recent: Picker opent op opgeslagen portie met juiste macros
// + knop blijft kopiëren wat er staat (zelfde als laatste log)

import React, { useState, useRef, useEffect } from 'react'
import MealCard from '../day-schedule/MealCard'
import Keuze from '../Keuze'
import { Search, Loader, X, ChevronRight, Plus, Star } from 'lucide-react'
import FatSecretService from './FatSecretService'
import { foodImageFallback } from '../../foodImageFallback'

// Twee keuzes in plaats van drie chips: wát je zoekt en wáár je zoekt.
const SOORTEN = [
  { id: 'products', label: 'Ingrediënten' },
  { id: 'meals',    label: 'Maaltijden' },
]
const BRONNEN = [
  { id: 'alles',      label: 'Overal' },
  { id: 'favorieten', label: 'Favorieten' },
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

export default function SearchTab({ db, onSelect, isMobile, client, onQuickLog, defaultMealMoment }) {
  const [mode, setMode] = useState('products')
  const [bron, setBron] = useState('alles')
  const [searchTerm, setSearchTerm] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [offLoading, setOffLoading] = useState(false)
  const [recentMeals, setRecentMeals] = useState([])
  const [recentsLoading, setRecentsLoading] = useState(true)
  // Favoriete producten van deze klant. Sleutel = bron|bron_id, zodat we per
  // zoekresultaat in één blik weten of de ster aan staat.
  const [favorieten, setFavorieten] = useState([])
  const [fatSecretService] = useState(() => db?.supabase ? new FatSecretService(db.supabase) : null)
  const inputRef = useRef(null)
  const debounceRef = useRef(null)

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 200)
  }, [])

  useEffect(() => {
    if (client?.id) {
      loadRecents()
      laadFavorieten()
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

  // ── Favorieten ──
  const favSleutel = (item) => `${item?.source || item?.bron || 'onbekend'}|${item?.id ?? item?.bron_id ?? item?.name ?? ''}`

  const laadFavorieten = async () => {
    try {
      const { data, error } = await db.supabase
        .from('client_food_favorites')
        .select('*')
        .eq('client_id', client.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      setFavorieten(data || [])
    } catch (e) {
      console.error('Favorieten laden mislukt:', e)
      setFavorieten([])
    }
  }

  // Zoeken binnen je favorieten gaat lokaal: het is een korte, eigen lijst.
  const zichtbareFavorieten = favorieten.filter(f =>
    !searchTerm || String(f.naam || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  const isFavoriet = (item) => favorieten.some(f => `${f.bron}|${f.bron_id}` === favSleutel(item))

  const wisselFavoriet = async (item) => {
    if (!client?.id) return
    const sleutel = favSleutel(item)
    const bestaand = favorieten.find(f => `${f.bron}|${f.bron_id}` === sleutel)
    // Meteen omzetten in beeld; de database volgt.
    if (bestaand) {
      setFavorieten(prev => prev.filter(f => f.id !== bestaand.id))
      const { error } = await db.supabase.from('client_food_favorites').delete().eq('id', bestaand.id)
      if (error) { console.error('Favoriet verwijderen mislukt:', error); laadFavorieten() }
      return
    }
    const rij = {
      client_id: client.id,
      bron: item.source || 'onbekend',
      bron_id: String(item.id ?? item.name ?? ''),
      naam: item.name,
      merk: item.brand || null,
      calories: item.calories ?? null,
      protein: item.protein ?? null,
      carbs: item.carbs ?? null,
      fat: item.fat ?? null,
      image_url: item.image_url || null,
      // De hele zoekregel bewaren: het portie-scherm verwacht dezelfde velden
      // (per100g, defaultPortion, sourceLabel) als bij het zoeken.
      payload: item,
    }
    setFavorieten(prev => [{ ...rij, id: `tijdelijk-${sleutel}` }, ...prev])
    const { data, error } = await db.supabase.from('client_food_favorites').insert(rij).select().single()
    if (error) { console.error('Favoriet opslaan mislukt:', error); laadFavorieten(); return }
    setFavorieten(prev => prev.map(f => f.id === `tijdelijk-${sleutel}` ? data : f))
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
      const [mealsRes, customRes] = await Promise.all([
        db.supabase
          .from('ai_meals')
          .select('id, name, name_en, calories, protein, carbs, fat, image_url, timing, ingredients_list')
          .or(`name.ilike.%${query}%,name_en.ilike.%${query}%`)
          .limit(20),
        client?.id
          ? db.supabase
              .from('ai_custom_meals')
              .select('id, name, calories, protein, carbs, fat, image_url, ingredients_list')
              .eq('client_id', client.id)
              .eq('is_active', true)
              .ilike('name', `%${query}%`)
              .limit(10)
          : Promise.resolve({ data: [] })
      ])

      const allResults = []

      // Eigen maaltijden van de klant eerst (meest herkenbaar)
      if (customRes.data) {
        customRes.data.slice().sort((a, b) => computeRelevance(a.name, query) - computeRelevance(b.name, query))
          .forEach(m => {
            allResults.push({
              id: m.id, name: m.name,
              calories: Math.round(m.calories || 0), protein: Math.round(m.protein || 0),
              carbs: Math.round(m.carbs || 0), fat: Math.round(m.fat || 0),
              image_url: m.image_url, type: 'custom_meal', source: 'custom',
              sourceLabel: 'Eigen', per100g: false,
              ingredients: Array.isArray(m.ingredients_list) ? m.ingredients_list : []
            })
          })
      }

      if (mealsRes.data) {
        // Sort by relevance so exact "rijst" outranks "rijst-yoghurt-bowl" etc.
        const sortedMeals = mealsRes.data.slice().sort((a, b) => {
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
            sourceLabel: timingLabel || 'Gerecht', per100g: false,
            // Neem de ingrediënten mee zodat de picker de samenstelling kan tonen
            // (een vaste maaltijd bestaat uit meerdere ingrediënten, geen "100 g").
            ingredients: Array.isArray(m.ingredients_list) ? m.ingredients_list : []
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
  // Van een gelogde regel een selecteerbaar item maken. Ook de ster gebruikt
  // dit, zodat een favoriet uit "Recent gelogd" straks op dezelfde portie
  // opent als toen je 'm logde.
  const alsItem = (meal) => {
    const isPer100g = meal.per_unit === 'gram'
    return {
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
    }
  }

  const handleSelectRecent = (meal) => onSelect(alsItem(meal))

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

      {/* ── Twee keuzes: wat en waar ── */}
      <div style={{
        display: 'flex', alignItems: 'center',
        padding: isMobile ? '0 1rem 0.75rem' : '0 1.25rem 0.875rem',
      }}>
        <Keuze waarde={mode} opties={SOORTEN} zet={setMode} isMobile={isMobile} />
        <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.15)', flexShrink: 0 }} />
        <Keuze waarde={bron} opties={BRONNEN} zet={setBron} isMobile={isMobile} uitlijning="rechts" />
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
        <div style={{ paddingBottom: '1rem' }}>
          {results.map((item, idx) => (
            <MealCard
              key={`${item.source}-${item.id}-${idx}`}
              meal={{
                name: item.name,
                image_url: item.image_url || foodImageFallback(item.name || item.product_name, null, 200),
                calories: item.calories, protein: item.protein,
                carbs: item.carbs, fat: item.fat,
              }}
              momentLabel={item.per100g ? 'per 100g' : item.defaultPortion ? `${item.defaultPortion}g` : (item.sourceLabel || 'Product')}
              tijdLabel={item.brand || null}
              isMobile={isMobile}
              onCheck={() => onSelect(item)}
              hoekKnop={<SterKnop aan={isFavoriet(item)} onClick={() => wisselFavoriet(item)} />}
              acties={[{ icon: <Plus size={11} strokeWidth={3} />, label: 'Kies', onClick: () => onSelect(item) }]}
            />
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
          {bron === 'favorieten' && (
            <>
              <Kopje isMobile={isMobile}>Favorieten</Kopje>
              {zichtbareFavorieten.length === 0 ? (
                <div style={{ padding: '2.5rem 1.25rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 900, color: '#fff', marginBottom: 4 }}>
                    {searchTerm ? 'Niets gevonden in je favorieten' : 'Nog geen favorieten'}
                  </div>
                  <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>
                    {searchTerm
                      ? 'Zet de tweede keuze op Overal om alles te doorzoeken.'
                      : "Tik op de ster bij een product om 'm hier te bewaren."}
                  </div>
                </div>
              ) : (
                <div style={{ paddingBottom: '1rem' }}>
                  {zichtbareFavorieten.map(f => {
                    const item = f.payload || {
                      id: f.bron_id, source: f.bron, name: f.naam, brand: f.merk,
                      calories: f.calories, protein: f.protein, carbs: f.carbs, fat: f.fat,
                      image_url: f.image_url,
                    }
                    return (
                      <MealCard
                        key={f.id}
                        meal={{
                          name: f.naam,
                          image_url: f.image_url || foodImageFallback(f.naam, null, 200),
                          calories: f.calories, protein: f.protein, carbs: f.carbs, fat: f.fat,
                        }}
                        momentLabel="Favoriet"
                        tijdLabel={f.merk || null}
                        isMobile={isMobile}
                        onCheck={() => onSelect(item)}
                        hoekKnop={<SterKnop aan onClick={() => wisselFavoriet(item)} />}
                        acties={[{ icon: <Plus size={11} strokeWidth={3} />, label: 'Kies', onClick: () => onSelect(item) }]}
                      />
                    )
                  })}
                </div>
              )}
            </>
          )}

          {bron !== 'favorieten' && recentMeals.length > 0 && (
            <div style={{
              padding: isMobile ? '0.625rem 1rem 0.5rem' : '0.75rem 1.25rem 0.625rem',
            }}>
              <div style={{
                fontSize: isMobile ? '0.62rem' : '0.66rem',
                fontWeight: 800, color: 'rgba(255, 255, 255, 0.4)',
                textTransform: 'uppercase', letterSpacing: '0.1em'
              }}>
                Recent gelogd
              </div>
            </div>
          )}

          {bron !== 'favorieten' && recentsLoading && (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255, 255, 255, 0.2)', fontSize: '0.8rem' }}>
              Laden...
            </div>
          )}

          {bron !== 'favorieten' && !recentsLoading && recentMeals.length > 0 && (
            <div style={{ paddingBottom: '1rem' }}>
              {recentMeals.map((meal, idx) => {
                const portionTxt = meal.amount && meal.per_unit
                  ? `${meal.amount}${meal.per_unit === 'gram' ? 'g' : meal.amount === 1 ? ' portie' : ' porties'}`
                  : ''
                // Hoe vaak je het al logde staat op de foto in plaats van als
                // los badgetje op een icoontje.
                const vaker = meal.count > 1 ? `${meal.count}× gelogd` : 'Eerder gelogd'
                return (
                  <MealCard
                    key={meal.id || idx}
                    meal={{
                      name: meal.meal_name,
                      image_url: meal.image_url,
                      calories: meal.calories, protein: meal.protein,
                      carbs: meal.carbs, fat: meal.fat,
                    }}
                    momentLabel={vaker}
                    tijdLabel={[portionTxt, formatTimeAgo(meal.consumed_at)].filter(Boolean).join(' · ')}
                    isMobile={isMobile}
                    onCheck={() => handleSelectRecent(meal)}
                    hoekKnop={(() => {
                      const item = alsItem(meal)
                      return <SterKnop aan={isFavoriet(item)} onClick={() => wisselFavoriet(item)} />
                    })()}
                    acties={[
                      ...(onQuickLog ? [{ icon: <Plus size={11} strokeWidth={3} />, label: 'Loggen', onClick: () => handleQuickLog(meal) }] : []),
                      { icon: <ChevronRight size={11} strokeWidth={2.6} />, label: 'Aanpassen', onClick: () => handleSelectRecent(meal) },
                    ]}
                  />
                )
              })}
            </div>
          )}

          {bron !== 'favorieten' && !recentsLoading && recentMeals.length === 0 && (
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

// Ster rechtsboven op een kaart: product bij je favorieten zetten of eraf
// halen. Gevuld = staat erin.
function SterKnop({ aan, onClick }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick?.() }}
      aria-label={aan ? 'Uit favorieten halen' : 'Bij favorieten zetten'}
      title={aan ? 'Uit favorieten halen' : 'Bij favorieten zetten'}
      style={{
        width: 28, height: 28, padding: 0,
        background: 'transparent', border: 'none', borderRadius: 7,
        color: '#fff', opacity: aan ? 1 : 0.55,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
      }}
    >
      <Star size={14} strokeWidth={2.6} fill={aan ? '#fff' : 'none'} />
    </button>
  )
}

function Kopje({ children, isMobile }) {
  return (
    <div style={{ padding: isMobile ? '0.625rem 1rem 0.5rem' : '0.75rem 1.25rem 0.625rem' }}>
      <div style={{
        fontSize: isMobile ? '0.62rem' : '0.66rem',
        fontWeight: 800, color: 'rgba(255,255,255,0.4)',
        textTransform: 'uppercase', letterSpacing: '0.1em',
      }}>
        {children}
      </div>
    </div>
  )
}
