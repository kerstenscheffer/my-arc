// src/modules/meal-plan/VoedingsGids.jsx
// Voedingsgids — eerste versie (issue 19ee0bf7, deel 2 "Voedingsgids").
// Scrollbare lijst van de gecureerde coach-ingrediënten (ai_ingredients waar
// source='coach', ~333 stuks) met foto, kcal/100g, macro's en eigenschappen.
// Het "goed / oké / vermijden"-signaal wordt OBJECTIEF afgeleid uit de labels
// die de coach zelf al heeft gezet (clean/whole_food/high_protein vs
// processed/calorie_dense), gewogen naar het gekozen doel. Niets verzonnen.
import React, { useState, useEffect, useMemo } from 'react'

const GOLD = '#FFD700'

// ── Doel-opties ──────────────────────────────────────────────────────────
const GOALS = [
  { id: 'afvallen', label: 'Afvallen' },
  { id: 'spieren',  label: 'Spieropbouw' },
  { id: 'algemeen', label: 'Algemeen' },
]
// client.primary_goal → doel-id
const GOAL_FROM_CLIENT = {
  afvallen: 'afvallen', fat_loss: 'afvallen', weight_loss: 'afvallen',
  spieren: 'spieren', muscle_gain: 'spieren',
  recomp: 'algemeen', body_recomposition: 'algemeen',
  fitness: 'algemeen', general_fitness: 'algemeen',
}

// ── Categorie-chips ──────────────────────────────────────────────────────
const CATEGORIES = [
  { id: 'all',        label: 'Alles' },
  { id: 'protein',    label: 'Eiwit' },
  { id: 'carbs',      label: 'Koolhydraten' },
  { id: 'vegetables', label: 'Groente' },
  { id: 'fruits',     label: 'Fruit' },
  { id: 'dairy',      label: 'Zuivel' },
  { id: 'fats',       label: 'Vetten' },
  { id: 'condiments', label: 'Sauzen' },
]
const CAT_COLOR = {
  protein: '#ef6b6b', carbs: '#e0a13c', vegetables: '#3cae6b',
  fruits: '#d65bb0', dairy: '#5b8fd6', fats: '#d4af37', condiments: '#8a8a8a', other: '#666',
}

// ── Label → NL eigenschap ────────────────────────────────────────────────
const LABEL_NL = {
  low_cal: 'Caloriearm', calorie_dense: 'Caloriedicht',
  high_protein: 'Eiwitrijk', high_fat: 'Vetrijk', healthy_fats: 'Gezonde vetten',
  high_carbs: 'Koolhydraatrijk', high_fiber: 'Vezelrijk',
  clean: 'Clean', whole_food: 'Onbewerkt', processed: 'Bewerkt',
  micronutrient_dense: 'Micronutriënt-rijk', cut_friendly: 'Cut-vriendelijk',
  keto_friendly: 'Keto', versatile: 'Veelzijdig', breakfast: 'Ontbijt',
  vegan: 'Vegan', vegetarian: 'Vegetarisch',
}
const prettyLabel = (l) => LABEL_NL[l] || l.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

const POSITIVE = new Set(['low_cal', 'high_protein', 'high_fiber', 'healthy_fats', 'clean', 'whole_food', 'micronutrient_dense', 'cut_friendly'])
const NEGATIVE = new Set(['processed', 'calorie_dense'])

// Tier: 'good' | 'ok' | 'avoid' — afgeleid uit labels + macro's, per doel.
function tierFor(ing, goal) {
  const labels = Array.isArray(ing.labels) ? ing.labels : []
  const has = (l) => labels.includes(l)
  const kcal = Number(ing.calories_per_100g) || 0
  const prot = Number(ing.protein_per_100g) || 0
  const fiber = Number(ing.fiber_per_100g) || 0
  const proc = has('processed')
  const dense = has('calorie_dense')

  if (goal === 'afvallen') {
    if (proc || dense || kcal >= 300) return 'avoid'
    if (has('low_cal') || has('cut_friendly') || has('high_fiber') || kcal <= 80 || fiber >= 4) return 'good'
    return 'ok'
  }
  if (goal === 'spieren') {
    // Eiwitdichtheid: gram eiwit per 100 kcal.
    const protDensity = kcal > 0 ? (prot / kcal) * 100 : 0
    if (has('high_protein') || prot >= 18 || protDensity >= 12) return 'good'
    if (proc && prot < 8) return 'avoid'
    return 'ok'
  }
  // algemeen
  if (proc || dense) return 'avoid'
  if (has('clean') || has('whole_food') || has('micronutrient_dense')) return 'good'
  return 'ok'
}
const TIER = {
  good:  { color: '#10b981', label: 'Goede keuze' },
  ok:    { color: '#f59e0b', label: 'Prima in balans' },
  avoid: { color: '#ef4444', label: 'Met mate' },
}

export default function VoedingsGids({ client, db }) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [goal, setGoal] = useState(GOAL_FROM_CLIENT[client?.primary_goal] || 'algemeen')
  const [category, setCategory] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const { data, error } = await db.supabase
          .from('ai_ingredients')
          .select('id,name,category,calories_per_100g,protein_per_100g,carbs_per_100g,fat_per_100g,fiber_per_100g,labels,image_url')
          .eq('source', 'coach')
          .order('name', { ascending: true })
        if (error) throw error
        // Dedupe op naam — houd de "rijkste" record (met foto + meeste labels).
        const byName = new Map()
        for (const r of (data || [])) {
          const key = (r.name || '').trim().toLowerCase()
          if (!key) continue
          const score = (r.image_url ? 100 : 0) + (Array.isArray(r.labels) ? r.labels.length : 0)
          const prev = byName.get(key)
          if (!prev || score > prev._score) byName.set(key, { ...r, _score: score })
        }
        if (alive) setRows([...byName.values()])
      } catch (e) {
        console.error('Voedingsgids laden mislukt:', e)
        if (alive) setRows([])
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [db])

  const list = useMemo(() => {
    const q = search.trim().toLowerCase()
    let out = rows
      .filter(r => category === 'all' || r.category === category)
      .filter(r => !q || (r.name || '').toLowerCase().includes(q))
      .map(r => ({ ...r, _tier: tierFor(r, goal) }))

    const tierRank = { good: 0, ok: 1, avoid: 2 }
    out.sort((a, b) => {
      if (tierRank[a._tier] !== tierRank[b._tier]) return tierRank[a._tier] - tierRank[b._tier]
      if (goal === 'afvallen') return (Number(a.calories_per_100g) || 0) - (Number(b.calories_per_100g) || 0)
      if (goal === 'spieren')  return (Number(b.protein_per_100g) || 0) - (Number(a.protein_per_100g) || 0)
      return (a.name || '').localeCompare(b.name || '')
    })
    return out
  }, [rows, category, search, goal])

  return (
    <div style={{ minHeight: '100%', background: '#0a0a0a', color: '#fff', padding: isMobile ? '0.75rem 0.75rem 5rem' : '1rem 1rem 5rem' }}>
      {/* Kop */}
      <div style={{ textAlign: 'center', margin: '0.5rem 0 1rem' }}>
        <h2 style={{ fontSize: isMobile ? '1.4rem' : '1.7rem', fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.01em' }}>Voedingsgids</h2>
        <p style={{ fontSize: isMobile ? '0.78rem' : '0.85rem', color: 'rgba(255,255,255,0.55)', margin: '0.35rem 0 0', fontWeight: 500 }}>
          Scroll, vergelijk en leer welke keuzes bij <span style={{ color: GOLD, fontWeight: 700 }}>jouw doel</span> passen.
        </p>
      </div>

      {/* Doel-toggle */}
      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.65rem' }}>
        {GOALS.map(g => {
          const active = goal === g.id
          return (
            <button key={g.id} onClick={() => setGoal(g.id)} style={{
              flex: 1, padding: '0.6rem 0.4rem', borderRadius: 12,
              background: active ? 'rgba(255,215,0,0.12)' : 'rgba(255,255,255,0.03)',
              border: active ? `1.5px solid ${GOLD}` : '1px solid rgba(255,255,255,0.1)',
              color: active ? GOLD : 'rgba(255,255,255,0.6)',
              fontSize: isMobile ? '0.8rem' : '0.9rem', fontWeight: 900, cursor: 'pointer',
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            }}>{g.label}</button>
          )
        })}
      </div>

      {/* Zoek */}
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Zoek een ingrediënt…"
        style={{
          width: '100%', boxSizing: 'border-box', padding: '0.7rem 0.9rem', marginBottom: '0.6rem',
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12,
          color: '#fff', fontSize: '0.9rem', fontWeight: 600, outline: 'none', fontFamily: 'inherit',
        }}
      />

      {/* Categorie-chips */}
      <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.55rem', marginBottom: '0.5rem', WebkitOverflowScrolling: 'touch' }}>
        {CATEGORIES.map(c => {
          const active = category === c.id
          return (
            <button key={c.id} onClick={() => setCategory(c.id)} style={{
              flexShrink: 0, padding: '0.4rem 0.8rem', borderRadius: 999,
              background: active ? GOLD : 'rgba(255,255,255,0.04)',
              border: active ? `1px solid ${GOLD}` : '1px solid rgba(255,255,255,0.1)',
              color: active ? '#0a0a0a' : 'rgba(255,255,255,0.6)',
              fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap',
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            }}>{c.label}</button>
          )
        })}
      </div>

      {/* Legenda */}
      <div style={{ display: 'flex', gap: '0.9rem', justifyContent: 'center', marginBottom: '0.7rem', flexWrap: 'wrap' }}>
        {Object.entries(TIER).map(([k, t]) => (
          <span key={k} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.62rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: t.color }} /> {t.label}
          </span>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem' }}>Laden…</div>
      ) : list.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem' }}>Geen ingrediënten gevonden.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'rgba(255,255,255,0.35)', marginBottom: '0.1rem' }}>{list.length} ingrediënten</div>
          {list.map(r => <GidsCard key={r.id} ing={r} isMobile={isMobile} />)}
        </div>
      )}
    </div>
  )
}

function GidsCard({ ing, isMobile }) {
  const tier = TIER[ing._tier]
  const catColor = CAT_COLOR[ing.category] || CAT_COLOR.other
  const labels = (Array.isArray(ing.labels) ? ing.labels : []).slice(0, 3)
  const kcal = Number(ing.calories_per_100g)
  const macro = (v) => (v === null || v === undefined ? '–' : Math.round(Number(v) * 10) / 10)

  return (
    <div style={{
      display: 'flex', alignItems: 'stretch', gap: isMobile ? '0.7rem' : '0.85rem',
      background: '#111', border: '1px solid rgba(255,255,255,0.07)',
      borderLeft: `3px solid ${tier.color}`, borderRadius: 12, overflow: 'hidden',
      padding: isMobile ? '0.6rem 0.7rem' : '0.7rem 0.85rem',
    }}>
      {/* Foto / fallback */}
      <div style={{
        flexShrink: 0, width: isMobile ? 54 : 62, height: isMobile ? 54 : 62, borderRadius: 10,
        overflow: 'hidden', background: `${catColor}22`, border: `1px solid ${catColor}55`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {ing.image_url ? (
          <img src={ing.image_url} alt={ing.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => { e.target.style.display = 'none' }} />
        ) : (
          <span style={{ color: catColor, fontWeight: 900, fontSize: '1.3rem' }}>{(ing.name || '?').charAt(0).toUpperCase()}</span>
        )}
      </div>

      {/* Midden: naam + chips + macro's */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0.3rem' }}>
        <div style={{ fontSize: isMobile ? '0.95rem' : '1.05rem', fontWeight: 800, color: '#fff', lineHeight: 1.15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ing.name}</div>
        {labels.length > 0 && (
          <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
            {labels.map(l => (
              <span key={l} style={{ fontSize: '0.58rem', fontWeight: 700, color: 'rgba(255,255,255,0.55)', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '0.1rem 0.35rem' }}>
                {prettyLabel(l)}
              </span>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', gap: '0.7rem', fontSize: '0.62rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>
          <span><span style={{ color: 'rgba(255,255,255,0.7)' }}>{macro(ing.protein_per_100g)}</span> eiwit</span>
          <span><span style={{ color: 'rgba(255,255,255,0.7)' }}>{macro(ing.carbs_per_100g)}</span> kh</span>
          <span><span style={{ color: 'rgba(255,255,255,0.7)' }}>{macro(ing.fat_per_100g)}</span> vet</span>
        </div>
      </div>

      {/* Rechts: kcal */}
      <div style={{ flexShrink: 0, textAlign: 'right', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-end' }}>
        <div style={{ fontSize: isMobile ? '1.25rem' : '1.45rem', fontWeight: 900, color: GOLD, lineHeight: 1, letterSpacing: '-0.02em' }}>
          {Number.isFinite(kcal) ? Math.round(kcal) : '–'}
        </div>
        <div style={{ fontSize: '0.52rem', fontWeight: 700, color: 'rgba(255,215,0,0.45)' }}>kcal /100g</div>
      </div>
    </div>
  )
}
