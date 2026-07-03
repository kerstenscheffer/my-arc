// src/modules/meal-plan/GelegenhedenHub.jsx
// Client-view van de Gelegenheden-hub (meal guide deel 1).
// Per gelegenheid goede vs minder goede keuzes met kcal. Standaard gevuld met
// een onderzochte dataset (mealGuideDefaults) en aangevuld met door de coach
// toegevoegde items (meal_guide_items). Filter op goed/met mate + zoekbalk.
import { useState, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import { OCCASIONS } from './mealGuideOccasions'
import { defaultItemsFor, guideImageUrl } from './mealGuideDefaults'

const GOLD = '#FFD700'
const GREEN = '#10b981'
const RED = '#ef4444'

export default function GelegenhedenHub({ db }) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768
  const [occasion, setOccasion] = useState(OCCASIONS[0].id)
  const [coachItems, setCoachItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [verdictFilter, setVerdictFilter] = useState('all') // 'all' | 'good' | 'bad'
  const [query, setQuery] = useState('')

  useEffect(() => {
    let alive = true
    setLoading(true)
    ;(async () => {
      try {
        const { data } = await db.supabase
          .from('meal_guide_items')
          .select('*')
          .eq('occasion', occasion)
          .order('kcal', { ascending: true })
        if (alive) setCoachItems((data || []).map(d => ({ ...d, _source: 'coach' })))
      } catch (e) { console.error('Gelegenheden laden mislukt:', e); if (alive) setCoachItems([]) }
      finally { if (alive) setLoading(false) }
    })()
    return () => { alive = false }
  }, [occasion, db])

  // Defaults + coach-items mergen. Coach overschrijft een default met dezelfde
  // titel (zelfde gelegenheid), zodat de coach kan corrigeren/aanvullen.
  const merged = (() => {
    const byTitle = new Map()
    defaultItemsFor(occasion).forEach(it => byTitle.set(it.title.toLowerCase().trim(), it))
    coachItems.forEach(it => byTitle.set((it.title || '').toLowerCase().trim(), it))
    return [...byTitle.values()]
  })()

  const q = query.trim().toLowerCase()
  const filtered = merged.filter(i => {
    if (verdictFilter !== 'all' && i.verdict !== verdictFilter) return false
    if (q && !(i.title || '').toLowerCase().includes(q)) return false
    return true
  })

  const good = filtered.filter(i => i.verdict === 'good').sort((a, b) => (a.kcal || 0) - (b.kcal || 0))
  const bad = filtered.filter(i => i.verdict === 'bad').sort((a, b) => (a.kcal || 0) - (b.kcal || 0))

  const FILTERS = [
    { id: 'all', label: 'Alles', color: GOLD },
    { id: 'good', label: 'Goede keuzes', color: GREEN },
    { id: 'bad', label: 'Met mate', color: RED },
  ]

  return (
    <div style={{ minHeight: '100%', background: '#0a0a0a', color: '#fff', padding: isMobile ? '0.75rem 0.75rem 5rem' : '1rem 1rem 5rem' }}>
      <div style={{ textAlign: 'center', margin: '0.5rem 0 1rem' }}>
        <h2 style={{ fontSize: isMobile ? '1.4rem' : '1.7rem', fontWeight: 900, margin: 0 }}>Gelegenheden</h2>
        <p style={{ fontSize: isMobile ? '0.78rem' : '0.85rem', color: 'rgba(255,255,255,0.55)', margin: '0.35rem 0 0', fontWeight: 500 }}>
          Slimme keuzes voor elke situatie — <span style={{ color: GOLD, fontWeight: 700 }}>groen = top, rood = met mate.</span>
        </p>
      </div>

      {/* Gelegenheid-chips */}
      <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.55rem', marginBottom: '0.6rem', WebkitOverflowScrolling: 'touch' }}>
        {OCCASIONS.map(o => {
          const active = occasion === o.id
          return (
            <button key={o.id} onClick={() => setOccasion(o.id)} style={{
              flexShrink: 0, padding: '0.45rem 0.85rem', borderRadius: 999,
              background: active ? GOLD : 'rgba(255,255,255,0.04)',
              border: active ? `1px solid ${GOLD}` : '1px solid rgba(255,255,255,0.1)',
              color: active ? '#0a0a0a' : 'rgba(255,255,255,0.6)', fontSize: '0.76rem', fontWeight: 800,
              cursor: 'pointer', whiteSpace: 'nowrap',
            }}>{o.emoji} {o.label}</button>
          )
        })}
      </div>

      {/* Zoekbalk */}
      <div style={{ position: 'relative', marginBottom: '0.6rem' }}>
        <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.35)' }} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Zoek een product…"
          style={{
            width: '100%', boxSizing: 'border-box', padding: '0.55rem 2rem 0.55rem 2rem',
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 10, color: '#fff', fontSize: '0.85rem', fontWeight: 600, outline: 'none',
          }}
        />
        {query && (
          <button onClick={() => setQuery('')} style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: 4 }}>
            <X size={14} />
          </button>
        )}
      </div>

      {/* Goed/slecht filter */}
      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.9rem' }}>
        {FILTERS.map(f => {
          const active = verdictFilter === f.id
          return (
            <button key={f.id} onClick={() => setVerdictFilter(f.id)} style={{
              flex: 1, padding: '0.4rem 0.5rem', borderRadius: 8,
              background: active ? `${f.color}22` : 'rgba(255,255,255,0.03)',
              border: `1px solid ${active ? f.color : 'rgba(255,255,255,0.1)'}`,
              color: active ? f.color : 'rgba(255,255,255,0.55)', fontSize: '0.74rem', fontWeight: 800,
              cursor: 'pointer',
            }}>{f.label}</button>
          )
        })}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: 'rgba(255,255,255,0.3)' }}>Laden…</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem' }}>
          {q ? `Geen producten gevonden voor "${query.trim()}".` : 'Geen keuzes voor deze gelegenheid.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <GuideBlock title="Goede keuzes" color={GREEN} items={good} isMobile={isMobile} />
          <GuideBlock title="Met mate" color={RED} items={bad} isMobile={isMobile} />
        </div>
      )}
    </div>
  )
}

function GuideBlock({ title, color, items, isMobile }) {
  if (items.length === 0) return null
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.6rem' }}>
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
        <span style={{ fontSize: '0.95rem', fontWeight: 900, color: '#fff' }}>{title}</span>
        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.35)' }}>· {items.length}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, 1fr)', gap: '0.5rem' }}>
        {items.map(i => (
          <div key={i.id} style={{ background: '#111', border: `1px solid ${color}33`, borderLeft: `3px solid ${color}`, borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ position: 'relative', width: '100%', height: isMobile ? 90 : 110, background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {/* Emoji zit eronder; de foto ligt erover en wordt bij een laadfout
                  verborgen zodat de emoji weer zichtbaar wordt. */}
              <span style={{ fontSize: '1.8rem' }}>🍽️</span>
              {guideImageUrl(i) && (
                <img
                  src={guideImageUrl(i)}
                  alt={i.title}
                  loading="lazy"
                  onError={(e) => { e.currentTarget.style.display = 'none' }}
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                />
              )}
            </div>
            <div style={{ padding: '0.5rem 0.6rem 0.6rem' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#fff', lineHeight: 1.2, marginBottom: '0.15rem' }}>{i.title}</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 900, color }}>{i.kcal ? `${i.kcal}` : '–'}<span style={{ fontSize: '0.55rem', fontWeight: 700, opacity: 0.7, marginLeft: 2 }}>kcal</span></div>
              {i.note && <div style={{ fontSize: '0.66rem', fontWeight: 500, color: 'rgba(255,255,255,0.5)', marginTop: '0.2rem', lineHeight: 1.3 }}>{i.note}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
