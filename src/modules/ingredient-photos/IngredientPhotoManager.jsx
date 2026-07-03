// src/modules/ingredient-photos/IngredientPhotoManager.jsx
// Coach-tool: loop snel langs ingrediënten zonder foto. Per ingrediënt haalt
// hij internet-suggesties op (Wikipedia + OpenFoodFacts); de coach accepteert
// met één tik, vraagt een andere suggestie, past de zoekterm aan of plakt een
// eigen URL. Zo krijgt elk ingrediënt de juiste foto met minimale moeite.
import { useState, useEffect, useCallback } from 'react'
import { Image as ImageIcon, Check, RotateCw, SkipForward, Loader, Link2 } from 'lucide-react'

const GOLD = '#FFD700'

// Strip kwalificaties die de zoekterm vertroebelen.
const cleanTerm = (n = '') => n
  .replace(/\(.*?\)/g, '')
  .replace(/\b(gekookt|gebakken|droog|vers|rauw|mager|magere|vol|volle|light|naturel|mix|blik|uit blik|los|heel)\b/gi, '')
  .replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim()

async function wikiCandidates(term) {
  const out = []
  for (const lang of ['nl', 'en']) {
    try {
      const url = `https://${lang}.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(term)}&gsrlimit=3&gsrnamespace=0&prop=pageimages&piprop=thumbnail&pithumbsize=600&format=json&origin=*`
      const res = await fetch(url, { headers: { 'User-Agent': 'MyArc/1.0' } })
      if (!res.ok) continue
      const d = await res.json()
      const pages = d.query?.pages ? Object.values(d.query.pages) : []
      for (const p of pages) if (p?.thumbnail?.source) out.push(p.thumbnail.source)
      if (out.length) break // NL gaf resultaat → niet ook EN doen
    } catch { /* skip */ }
  }
  return out
}
async function offCandidates(term) {
  try {
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(term)}&search_simple=1&action=process&json=1&page_size=3&fields=image_front_url`
    const res = await fetch(url, { headers: { 'User-Agent': 'MyArc/1.0' } })
    if (!res.ok) return []
    const d = await res.json()
    return (d.products || []).map(p => p.image_front_url).filter(Boolean)
  } catch { return [] }
}

export default function IngredientPhotoManager({ db, isMobile }) {
  const m = isMobile
  const [items, setItems] = useState([])
  const [idx, setIdx] = useState(0)
  const [loading, setLoading] = useState(true)
  const [term, setTerm] = useState('')
  const [candidates, setCandidates] = useState([])
  const [candIdx, setCandIdx] = useState(0)
  const [fetching, setFetching] = useState(false)
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(0)
  const [pasteUrl, setPasteUrl] = useState('')

  useEffect(() => {
    (async () => {
      const { data } = await db.supabase
        .from('ai_ingredients').select('id, name, image_url')
        .eq('source', 'coach').order('name')
      const photoless = (data || []).filter(r => !r.image_url || r.image_url.trim() === '')
      setItems(photoless); setLoading(false)
    })()
  }, [])

  const current = items[idx]

  const runSearch = useCallback(async (t) => {
    setFetching(true); setCandIdx(0); setCandidates([])
    const [w, o] = await Promise.all([wikiCandidates(t), offCandidates(t)])
    setCandidates([...w, ...o])
    setFetching(false)
  }, [])

  // Nieuwe ingredient → term + zoeken.
  useEffect(() => {
    if (!current) return
    const t = cleanTerm(current.name) || current.name
    setTerm(t); setPasteUrl('')
    runSearch(t)
  }, [idx, items, current, runSearch])

  const accept = async (url) => {
    if (!current || !url) return
    setSaving(true)
    try {
      // Zet de foto op dit ingrediënt én op eventuele naam-duplicaten zonder foto.
      const sameName = items.filter(it => it.name === current.name).map(it => it.id)
      await db.supabase.from('ai_ingredients').update({ image_url: url }).in('id', sameName)
      setDone(d => d + sameName.length)
      // Verwijder de behandelde naam uit de wachtrij; de volgende schuift door
      // naar dezelfde index. Clamp idx op de nieuwe (kortere) lijst.
      const newItems = items.filter(it => it.name !== current.name)
      setItems(newItems)
      setIdx(i => Math.min(i, Math.max(0, newItems.length - 1)))
    } catch (e) { console.error('Save photo failed:', e) }
    setSaving(false)
  }

  const skip = () => setIdx(i => i + 1)
  const cand = candidates[candIdx] || null

  if (loading) return <Centered>Laden…</Centered>
  if (!current) return (
    <Centered>
      <Check size={40} color="#10b981" />
      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', marginTop: 12 }}>Alle ingrediënten hebben een foto 🎉</div>
      {done > 0 && <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>{done} deze sessie toegevoegd</div>}
    </Centered>
  )

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: m ? '1rem' : '1.5rem', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <ImageIcon size={20} color={GOLD} />
        <h1 style={{ fontSize: m ? '1.1rem' : '1.3rem', fontWeight: 900, color: GOLD, margin: 0 }}>Ingredient foto's</h1>
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>{items.length} zonder foto · {done} klaar</span>
      </div>

      {/* Kaart */}
      <div style={{ background: '#0a0a0a', border: '1px solid rgba(255,215,0,0.2)', borderRadius: 16, padding: m ? '1rem' : '1.25rem' }}>
        <div style={{ fontSize: m ? '1.05rem' : '1.2rem', fontWeight: 900, color: '#fff', marginBottom: 4, letterSpacing: '-0.01em' }}>{current.name}</div>

        {/* Zoekterm */}
        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginBottom: '0.85rem' }}>
          <input
            value={term} onChange={e => setTerm(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') runSearch(term) }}
            placeholder="zoekterm"
            style={{ flex: 1, padding: '0.5rem 0.7rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: '0.8rem', outline: 'none', fontFamily: 'inherit' }}
          />
          <button onClick={() => runSearch(term)} style={btn('rgba(255,215,0,0.1)', 'rgba(255,215,0,0.35)', GOLD)}>Zoek</button>
        </div>

        {/* Voorbeeld */}
        <div style={{ width: '100%', aspectRatio: '1 / 1', maxHeight: 320, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: '0.4rem' }}>
          {fetching ? (
            <Loader size={28} color={GOLD} style={{ animation: 'spin 1s linear infinite' }} />
          ) : cand ? (
            <img src={cand} alt={current.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          ) : (
            <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)' }}>Geen suggestie gevonden — pas de zoekterm aan of plak een URL</span>
          )}
        </div>
        <div style={{ textAlign: 'center', fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', marginBottom: '0.85rem' }}>
          {candidates.length > 0 ? `suggestie ${candIdx + 1} / ${candidates.length}` : ''}
        </div>

        {/* Acties */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.6rem' }}>
          <button onClick={() => accept(cand)} disabled={!cand || saving} style={{ ...btn('rgba(16,185,129,0.12)', 'rgba(16,185,129,0.4)', '#10b981'), flex: 2, justifyContent: 'center', opacity: (!cand || saving) ? 0.4 : 1, minHeight: 44 }}>
            <Check size={16} /> Accepteren
          </button>
          <button onClick={() => setCandIdx(i => (i + 1) % Math.max(1, candidates.length))} disabled={candidates.length < 2} style={{ ...btn('rgba(255,255,255,0.05)', 'rgba(255,255,255,0.12)', '#fff'), flex: 1, justifyContent: 'center', opacity: candidates.length < 2 ? 0.4 : 1, minHeight: 44 }}>
            <RotateCw size={15} /> Andere
          </button>
          <button onClick={skip} style={{ ...btn('rgba(255,255,255,0.04)', 'rgba(255,255,255,0.1)', 'rgba(255,255,255,0.6)'), justifyContent: 'center', minHeight: 44 }}>
            <SkipForward size={15} />
          </button>
        </div>

        {/* Eigen URL plakken */}
        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
          <Link2 size={14} color="rgba(255,255,255,0.3)" />
          <input value={pasteUrl} onChange={e => setPasteUrl(e.target.value)} placeholder="…of plak een eigen afbeeldings-URL" style={{ flex: 1, padding: '0.45rem 0.6rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#fff', fontSize: '0.72rem', outline: 'none', fontFamily: 'inherit' }} />
          <button onClick={() => accept(pasteUrl.trim())} disabled={!pasteUrl.trim() || saving} style={{ ...btn('rgba(255,215,0,0.1)', 'rgba(255,215,0,0.35)', GOLD), opacity: (!pasteUrl.trim() || saving) ? 0.4 : 1 }}>Zet</button>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

const btn = (bg, border, color) => ({
  display: 'flex', alignItems: 'center', gap: '0.3rem',
  padding: '0.5rem 0.8rem', background: bg, border: `1px solid ${border}`,
  borderRadius: 10, color, fontSize: '0.78rem', fontWeight: 800,
  cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', fontFamily: 'inherit',
})

function Centered({ children }) {
  return (
    <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: 'rgba(255,255,255,0.6)', padding: '2rem' }}>
      {children}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
