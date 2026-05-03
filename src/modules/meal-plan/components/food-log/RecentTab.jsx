// src/modules/meal-plan/components/food-log/RecentTab.jsx
// 🎯 v2.1 - Images toegevoegd (zelfde patroon als SearchTab ResultIcon)
import React, { useState, useEffect } from 'react'
import { Plus, Copy, ChevronRight, UtensilsCrossed } from 'lucide-react'

export default function RecentTab({ client, db, onSelect, onQuickLog, onCopyYesterday, isMobile, defaultMealMoment }) {
  const [recentMeals, setRecentMeals] = useState([])
  const [loading, setLoading] = useState(true)
  const [yesterdayCount, setYesterdayCount] = useState(0)

  const accent = '#10b981'

  useEffect(() => {
    if (client?.id) {
      loadRecents()
      checkYesterday()
    }
  }, [client?.id])

  const loadRecents = async () => {
    setLoading(true)
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

      const sorted = Array.from(freqMap.values())
        .sort((a, b) => {
          if (b.count !== a.count) return b.count - a.count
          return new Date(b.consumed_at) - new Date(a.consumed_at)
        })

      setRecentMeals(sorted)
    } catch (err) {
      console.error('Failed to load recents:', err)
      setRecentMeals([])
    } finally {
      setLoading(false)
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
    } catch {
      setYesterdayCount(0)
    }
  }

  const handleQuickLog = (meal) => {
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
      meal_type: defaultMealMoment || meal.meal_type || 'snack'
    })
  }

  const handleSelect = (meal) => {
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
      per100g: true
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

  if (loading) {
    return (
      <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'rgba(255, 255, 255, 0.2)', fontSize: '0.8rem' }}>
        Laden...
      </div>
    )
  }

  return (
    <div>
      {/* ── Kopieer gisteren ── */}
      {yesterdayCount > 0 && onCopyYesterday && (
        <button
          onClick={onCopyYesterday}
          style={{
            display: 'flex', alignItems: 'center',
            gap: '0.5rem', width: '100%',
            padding: isMobile ? '0.75rem 1rem' : '0.875rem 1.25rem',
            background: 'rgba(16, 185, 129, 0.04)',
            border: 'none',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            cursor: 'pointer', textAlign: 'left',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            minHeight: '48px'
          }}
          onTouchStart={(e) => { if (isMobile) e.currentTarget.style.background = 'rgba(16, 185, 129, 0.08)' }}
          onTouchEnd={(e) => { if (isMobile) e.currentTarget.style.background = 'rgba(16, 185, 129, 0.04)' }}
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
              {yesterdayCount} maaltijd{yesterdayCount !== 1 ? 'en' : ''} van gisteren opnieuw loggen
            </div>
          </div>
          <ChevronRight size={14} color="rgba(16, 185, 129, 0.3)" />
        </button>
      )}

      {/* ── Section header ── */}
      {recentMeals.length > 0 && (
        <div style={{
          padding: isMobile ? '0.5rem 1rem' : '0.625rem 1.25rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.04)'
        }}>
          <div style={{
            fontSize: isMobile ? '0.4rem' : '0.45rem',
            fontWeight: '700', color: 'rgba(255, 255, 255, 0.2)',
            textTransform: 'uppercase', letterSpacing: '0.06em'
          }}>
            Geschiedenis
          </div>
        </div>
      )}

      {/* ── Recent meals list ── */}
      {recentMeals.map((meal, idx) => (
        <div
          key={meal.id || idx}
          style={{
            display: 'flex', alignItems: 'center',
            borderBottom: idx < recentMeals.length - 1
              ? '1px solid rgba(255, 255, 255, 0.04)' : 'none'
          }}
        >
          {/* Main area: tap to select */}
          <button
            onClick={() => handleSelect(meal)}
            style={{
              flex: 1, minWidth: 0,
              display: 'flex', alignItems: 'center', gap: isMobile ? '0.625rem' : '0.75rem',
              padding: isMobile ? '0.625rem 0.75rem' : '0.75rem 1rem',
              background: 'transparent', border: 'none',
              cursor: 'pointer', textAlign: 'left',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '52px'
            }}
          >
            {/* ✅ IMAGE: zelfde patroon als SearchTab ResultIcon */}
            {meal.image_url ? (
              <div style={{
                width: '40px', height: '40px', borderRadius: '8px', flexShrink: 0,
                background: `url(${meal.image_url}) center/cover`,
                border: '1px solid rgba(255, 255, 255, 0.06)'
              }} />
            ) : meal.count > 1 ? (
              <div style={{
                width: '40px', height: '40px', borderRadius: '8px', flexShrink: 0,
                background: 'rgba(16, 185, 129, 0.06)',
                border: '1px solid rgba(16, 185, 129, 0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.55rem', fontWeight: '800', color: accent
              }}>
                {meal.count}x
              </div>
            ) : (
              <div style={{
                width: '40px', height: '40px', borderRadius: '8px', flexShrink: 0,
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'rgba(255, 255, 255, 0.15)'
              }}>
                <UtensilsCrossed size={14} />
              </div>
            )}

            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Name + count badge (als er ook een image is) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <span style={{
                  fontSize: isMobile ? '0.82rem' : '0.9rem',
                  fontWeight: '700', color: '#fff',
                  whiteSpace: 'nowrap', overflow: 'hidden',
                  textOverflow: 'ellipsis', letterSpacing: '-0.01em', lineHeight: 1.2,
                  flex: 1, minWidth: 0
                }}>
                  {meal.meal_name}
                </span>
                {/* Count badge naast naam als er een image is */}
                {meal.image_url && meal.count > 1 && (
                  <span style={{
                    fontSize: '0.45rem', fontWeight: '800', color: accent,
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    borderRadius: '4px', padding: '0.1rem 0.25rem',
                    flexShrink: 0
                  }}>
                    {meal.count}x
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.2rem' }}>
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
              </div>
            </div>

            <div style={{ fontSize: '0.5rem', fontWeight: '600', color: 'rgba(255, 255, 255, 0.15)', flexShrink: 0 }}>
              {formatTimeAgo(meal.consumed_at)}
            </div>
          </button>

          {/* Quick re-log button */}
          <button
            onClick={(e) => { e.stopPropagation(); handleQuickLog(meal) }}
            style={{
              width: isMobile ? '48px' : '52px',
              height: '100%', minHeight: '52px', flexShrink: 0,
              background: 'transparent', border: 'none',
              borderLeft: '1px solid rgba(255, 255, 255, 0.04)',
              color: accent, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              transition: 'background 0.15s ease'
            }}
            onTouchStart={(e) => { if (isMobile) e.currentTarget.style.background = 'rgba(16, 185, 129, 0.08)' }}
            onTouchEnd={(e) => { if (isMobile) e.currentTarget.style.background = 'transparent' }}
          >
            <Plus size={16} strokeWidth={2.5} />
          </button>
        </div>
      ))}

      {/* ── Empty state ── */}
      {recentMeals.length === 0 && (
        <div style={{ padding: '3rem 1rem', textAlign: 'center' }}>
          <div style={{
            fontSize: isMobile ? '0.85rem' : '0.95rem',
            fontWeight: '700', color: 'rgba(255, 255, 255, 0.3)',
            marginBottom: '0.5rem'
          }}>
            Nog geen gelogde maaltijden
          </div>
          <div style={{ fontSize: isMobile ? '0.65rem' : '0.7rem', color: 'rgba(255, 255, 255, 0.15)' }}>
            Zoek of scan je eerste maaltijd via de tabs hierboven
          </div>
        </div>
      )}
    </div>
  )
}
