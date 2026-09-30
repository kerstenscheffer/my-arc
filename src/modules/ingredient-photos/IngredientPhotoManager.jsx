// src/modules/ingredient-photos/IngredientPhotoManager.jsx
// Coach-tool: loop snel langs ingrediënten zonder foto. Per ingrediënt haalt
// hij internet-suggesties op (Wikipedia + OpenFoodFacts + Unsplash); de coach
// accepteert met één tik, vraagt een andere suggestie, past de zoekterm aan of
// plakt een eigen URL. Zo krijgt elk ingrediënt de juiste foto met minimale moeite.
//
// Over Unsplash: die suggesties komen via /api/unsplash, omdat de access key
// niet in de frontend-bundle mag. De API-richtlijnen van Unsplash verplichten
// drie dingen, en die zitten alle drie hieronder:
//   1. hotlinken — we bewaren alleen de URL die de API teruggaf, nooit de foto zelf;
//   2. attributie — fotograaf + profiellink worden getoond én meegeslagen bij
//      het ingrediënt, zodat de credit ook later nog klopt;
//   3. een download-melding zodra de coach een foto daadwerkelijk kiest.
// Wikipedia- en OpenFoodFacts-foto's hebben dat laatste niet nodig; daarom
// onthouden we per foto waar hij vandaan komt.
import { useState, useEffect, useCallback } from 'react'
import { Image as ImageIcon, Check, RotateCw, SkipForward, Loader, Link2 } from 'lucide-react'

// Strip kwalificaties die de zoekterm vertroebelen.
const cleanTerm = (n = '') => n
  .replace(/\(.*?\)/g, '')
  .replace(/\b(gekookt|gebakken|droog|vers|rauw|mager|magere|vol|volle|light|naturel|mix|blik|uit blik|los|heel)\b/gi, '')
  .replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim()

// Elke suggestie heeft dezelfde vorm, ongeacht de bron. `bron` bepaalt of er
// attributie bij hoort en of Unsplash een melding moet krijgen.
const suggestie = (url, bron, extra = {}) => ({ url, bron, ...extra })

async function wikiCandidates(term) {
  const out = []
  for (const lang of ['nl', 'en']) {
    try {
      const url = `https://${lang}.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(term)}&gsrlimit=3&gsrnamespace=0&prop=pageimages&piprop=thumbnail&pithumbsize=600&format=json&origin=*`
      const res = await fetch(url, { headers: { 'User-Agent': 'MyArc/1.0' } })
      if (!res.ok) continue
      const d = await res.json()
      const pages = d.query?.pages ? Object.values(d.query.pages) : []
      for (const p of pages) if (p?.thumbnail?.source) out.push(suggestie(p.thumbnail.source, 'wikipedia'))
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
      .map(u => suggestie(u, 'openfoodfacts'))
  } catch { return [] }
}

// Unsplash levert de mooie, "echte" foto's van onbewerkt eten — precies waar
// Wikipedia en OpenFoodFacts tekortschieten. De fout die we hier apart
// teruggeven is de uurlimiet; dat is iets anders dan "niets gevonden" en de
// coach moet het verschil zien.
async function unsplashCandidates(term) {
  try {
    const res = await fetch(`/api/unsplash?action=search&q=${encodeURIComponent(term)}&per_page=9`)
    const d = await res.json().catch(() => ({}))
    if (!res.ok) return { fotos: [], fout: d?.hint || d?.error || `Unsplash gaf ${res.status}` }
    const fotos = (d.fotos || []).map(f => suggestie(f.full, 'unsplash', {
      thumb: f.thumb,
      author: f.author,
      authorUrl: f.authorUrl,
      downloadLocation: f.downloadLocation,
      photoId: f.id,
    }))
    return { fotos, fout: null }
  } catch (e) {
    return { fotos: [], fout: e?.message || 'Unsplash niet bereikbaar' }
  }
}

const BRON_LABEL = {
  wikipedia: 'Wikipedia',
  openfoodfacts: 'Open Food Facts',
  unsplash: 'Unsplash',
  coach: 'eigen URL',
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
  const [unsplashFout, setUnsplashFout] = useState(null)

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
    setFetching(true); setCandIdx(0); setCandidates([]); setUnsplashFout(null)
    const [w, o, u] = await Promise.all([wikiCandidates(t), offCandidates(t), unsplashCandidates(t)])
    // Wikipedia en OpenFoodFacts eerst: die geven het product zelf. Unsplash
    // erachter als het mooiere, algemenere alternatief.
    setCandidates([...w, ...o, ...u.fotos])
    setUnsplashFout(u.fout)
    setFetching(false)
  }, [])

  // Nieuwe ingredient → term + zoeken.
  useEffect(() => {
    if (!current) return
    const t = cleanTerm(current.name) || current.name
    setTerm(t); setPasteUrl('')
    runSearch(t)
  }, [idx, items, current, runSearch])

  const accept = async (keuze) => {
    if (!current || !keuze?.url) return
    setSaving(true)
    try {
      // Verplicht bij Unsplash: melden dat deze foto gebruikt wordt. Eerst
      // melden, dan opslaan — maar een mislukte melding mag het opslaan niet
      // tegenhouden, anders verliest de coach zijn werk om een teller.
      if (keuze.bron === 'unsplash' && keuze.downloadLocation) {
        try {
          await fetch(`/api/unsplash?action=download&loc=${encodeURIComponent(keuze.downloadLocation)}`)
        } catch (e) { console.warn('Unsplash download-melding mislukt:', e) }
      }

      // Zet de foto op dit ingrediënt én op eventuele naam-duplicaten zonder foto.
      const sameName = items.filter(it => it.name === current.name).map(it => it.id)
      const patch = {
        image_url: keuze.url,
        image_source: keuze.bron,
        // Alleen Unsplash vraagt een naam bij de foto. Bij de andere bronnen
        // zetten we de velden expliciet leeg, zodat er nooit een credit van een
        // vorige foto blijft hangen.
        image_author: keuze.bron === 'unsplash' ? (keuze.author || null) : null,
        image_author_url: keuze.bron === 'unsplash' ? (keuze.authorUrl || null) : null,
        image_photo_id: keuze.bron === 'unsplash' ? (keuze.photoId || null) : null,
      }
      const { data, error } = await db.supabase
        .from('ai_ingredients').update(patch).in('id', sameName).select('id')
      if (error) throw error
      if (!data || data.length === 0) throw new Error('geen rij bijgewerkt')

      setDone(d => d + data.length)
      // Verwijder de behandelde naam uit de wachtrij; de volgende schuift door
      // naar dezelfde index. Clamp idx op de nieuwe (kortere) lijst.
      const newItems = items.filter(it => it.name !== current.name)
      setItems(newItems)
      setIdx(i => Math.min(i, Math.max(0, newItems.length - 1)))
    } catch (e) {
      console.error('Save photo failed:', e)
      alert('Foto opslaan mislukt: ' + (e?.message || e))
    }
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
        <ImageIcon size={20} color="#fff" strokeWidth={2.6} />
        <h1 style={{ fontSize: m ? '1.1rem' : '1.3rem', fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>Ingredient foto's</h1>
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>{items.length} zonder foto · {done} klaar</span>
      </div>

      {/* Kaart */}
      <div style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: m ? '1rem' : '1.25rem' }}>
        <div style={{ fontSize: m ? '1.05rem' : '1.2rem', fontWeight: 900, color: '#fff', marginBottom: 4, letterSpacing: '-0.01em' }}>{current.name}</div>

        {/* Zoekterm */}
        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginBottom: '0.85rem' }}>
          <input
            value={term} onChange={e => setTerm(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') runSearch(term) }}
            placeholder="zoekterm"
            style={{ flex: 1, padding: '0.5rem 0.7rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: '0.8rem', outline: 'none', fontFamily: 'inherit' }}
          />
          <button onClick={() => runSearch(term)} style={btn('rgba(255,255,255,0.08)', 'rgba(255,255,255,0.2)', '#fff')}>Zoek</button>
        </div>

        {/* Voorbeeld */}
        <div style={{ width: '100%', aspectRatio: '1 / 1', maxHeight: 320, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: '0.4rem' }}>
          {fetching ? (
            <Loader size={28} color="#fff" style={{ animation: 'spin 1s linear infinite' }} />
          ) : cand ? (
            <img src={cand.url} alt={cand.alt || current.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          ) : (
            <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)' }}>Geen suggestie gevonden — pas de zoekterm aan of plak een URL</span>
          )}
        </div>

        {/* Bron + verplichte attributie. Dit staat er vóór het accepteren, zodat
            de coach ziet wie de foto gemaakt heeft en niet per ongeluk een foto
            kiest die hij niet mag gebruiken zonder credit. */}
        <div style={{ textAlign: 'center', marginBottom: '0.85rem', minHeight: 26 }}>
          {cand && (
            <div style={{ fontSize: '0.64rem', color: 'rgba(255,255,255,0.45)', fontWeight: 700 }}>
              {cand.bron === 'unsplash' && cand.author ? (
                <>
                  Foto door{' '}
                  <a href={cand.authorUrl} target="_blank" rel="noreferrer noopener"
                     style={{ color: '#fff', textDecoration: 'underline' }}>{cand.author}</a>
                  {' '}op{' '}
                  <a href="https://unsplash.com/?utm_source=my_arc&utm_medium=referral" target="_blank" rel="noreferrer noopener"
                     style={{ color: '#fff', textDecoration: 'underline' }}>Unsplash</a>
                </>
              ) : (
                <>bron: {BRON_LABEL[cand.bron] || cand.bron}</>
              )}
            </div>
          )}
          <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
            {candidates.length > 0 ? `suggestie ${candIdx + 1} / ${candidates.length}` : ''}
            {unsplashFout ? `${candidates.length > 0 ? ' · ' : ''}Unsplash: ${unsplashFout}` : ''}
          </div>
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
          <button onClick={() => accept(suggestie(pasteUrl.trim(), 'coach'))} disabled={!pasteUrl.trim() || saving} style={{ ...btn('rgba(255,255,255,0.08)', 'rgba(255,255,255,0.2)', '#fff'), opacity: (!pasteUrl.trim() || saving) ? 0.4 : 1 }}>Zet</button>
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
