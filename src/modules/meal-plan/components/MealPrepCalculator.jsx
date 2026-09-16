// src/modules/meal-plan/components/MealPrepCalculator.jsx
// Meal-prep rekenhulp (issue 0f689436): je hebt net meal-prepped → voer in
// hoeveel van elk ingrediënt erin ging (totaal in gram) en in hoeveel bakjes je
// het verdeelt. De calculator laat de macro's PER BAKJE zien en slaat dat als
// maaltijd op in je Quick log (ai_custom_meals), zodat je 1 bakje makkelijk logt.
import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X, Search, Plus, Trash2, Check, Image as ImageIcon } from 'lucide-react'
import { resolveFoodImage } from '../foodImageFallback'

const GOLD = '#FFD700'
const r = (n) => Math.round((Number(n) || 0) * 10) / 10

export default function MealPrepCalculator({ client, db, onClose, onSaved }) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768
  const [search, setSearch] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState([])          // { ing, grams }
  const [bakjes, setBakjes] = useState(4)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [justAdded, setJustAdded] = useState('')   // naam van laatst toegevoegd ingrediënt (feedback)
  const searchInputRef = useRef(null)
  // Foto-stap bij opslaan
  const [showPhotoStep, setShowPhotoStep] = useState(false)
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [photoUploading, setPhotoUploading] = useState(false)

  // Ingrediënten zoeken (coach-set, zelfde bron als de Voedingsgids).
  useEffect(() => {
    const term = search.trim()
    if (!term) { setResults([]); return }
    let alive = true
    setLoading(true)
    const t = setTimeout(async () => {
      try {
        // Typo-tolerant + losse-woorden zoeken (RPC met pg_trgm).
        const { data, error } = await db.supabase.rpc('search_coach_ingredients', { term })
        if (error) throw error
        if (alive) setResults(data || [])
      } catch (e) { console.error('zoeken mislukt', e); if (alive) setResults([]) }
      finally { if (alive) setLoading(false) }
    }, 250)
    return () => { alive = false; clearTimeout(t) }
  }, [search, db])

  const addIng = (ing) => {
    if (rows.some(rw => rw.ing.id === ing.id)) return
    setRows(prev => [...prev, { ing, grams: 500 }])
    // Modal blijft open zodat je meerdere ingrediënten kunt toevoegen.
    // Reset de zoekterm + resultaten zodat je meteen fris kunt zoeken naar
    // het volgende ingrediënt, en houd het toetsenbord open (refocus).
    setSearch('')
    setResults([])
    setJustAdded(ing.name)
    setTimeout(() => searchInputRef.current?.focus(), 0)
  }
  const setGrams = (id, g) => setRows(prev => prev.map(rw => rw.ing.id === id ? { ...rw, grams: g } : rw))
  const removeIng = (id) => setRows(prev => prev.filter(rw => rw.ing.id !== id))

  // Totaal over de hele meal-prep.
  const total = rows.reduce((t, rw) => {
    const f = (Number(rw.grams) || 0) / 100
    t.calories += (rw.ing.calories_per_100g || 0) * f
    t.protein += (rw.ing.protein_per_100g || 0) * f
    t.carbs += (rw.ing.carbs_per_100g || 0) * f
    t.fat += (rw.ing.fat_per_100g || 0) * f
    t.fiber += (rw.ing.fiber_per_100g || 0) * f
    return t
  }, { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 })

  const n = Math.max(1, parseInt(bakjes, 10) || 1)
  const per = { calories: total.calories / n, protein: total.protein / n, carbs: total.carbs / n, fat: total.fat / n, fiber: total.fiber / n }

  // Klik op "Voeg maaltijd toe" → eerst om een foto vragen.
  const onSaveClick = () => {
    if (!name.trim() || rows.length === 0) { alert('Geef een naam en voeg ingrediënten toe.'); return }
    if (!client?.id) { alert('Geen client.'); return }
    setSavedMsg(''); setShowPhotoStep(true)
  }

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const uploadMealPhoto = async (file) => {
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
    const fileName = `${client.id}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`
    const { error } = await db.supabase.storage.from('meal-photos').upload(fileName, file, { contentType: file.type || 'image/jpeg', upsert: false })
    if (error) throw error
    const { data: { publicUrl } } = db.supabase.storage.from('meal-photos').getPublicUrl(fileName)
    return publicUrl
  }

  // Daadwerkelijk opslaan + modal direct sluiten.
  const doSave = async (imageUrl) => {
    setSaving(true); setSavedMsg('')
    try {
      // Per bakje opslaan in de VOLLE vorm die MealDetailView verwacht:
      // naam + grammen + macro's per bakje (anders laden de macro's niet bij het
      // openen van de opgeslagen maaltijd).
      const ingredientsList = rows.map(rw => {
        const amt = Math.round((Number(rw.grams) || 0) / n)
        const f = amt / 100
        return {
          ingredient_id: rw.ing.id,
          name: rw.ing.name,
          amount: amt,
          unit: 'gram',
          calories: Math.round((rw.ing.calories_per_100g || 0) * f),
          protein: r((rw.ing.protein_per_100g || 0) * f),
          carbs: r((rw.ing.carbs_per_100g || 0) * f),
          fat: r((rw.ing.fat_per_100g || 0) * f),
          fiber: r((rw.ing.fiber_per_100g || 0) * f),
          image_url: rw.ing.image_url || null,
        }
      })
      const mealData = {
        client_id: client.id,
        name: name.trim(),
        ingredients_list: ingredientsList,
        calories: Math.round(per.calories),
        protein: r(per.protein), carbs: r(per.carbs), fat: r(per.fat), fiber: r(per.fiber),
        meal_type: ['snack'],
        is_active: true,
        image_url: imageUrl || null,
        created_at: new Date().toISOString(),
      }
      const { data, error } = await db.supabase.from('ai_custom_meals').insert(mealData).select().single()
      if (error) throw error
      onSaved?.(data)
      onClose?.()   // sluit de modal direct
    } catch (e) {
      setSaving(false)
      setSavedMsg('Opslaan mislukt: ' + (e?.message || JSON.stringify(e)))
    }
  }

  // Vanuit de foto-stap: upload (indien gekozen) en sla op.
  const confirmSave = async () => {
    let url = null
    if (photoFile) {
      setPhotoUploading(true)
      try { url = await uploadMealPhoto(photoFile) }
      catch { setPhotoUploading(false); setSavedMsg('Foto uploaden mislukt, probeer opnieuw of sla op zonder foto.'); return }
      setPhotoUploading(false)
    }
    await doSave(url)
  }

  const inputStyle = { padding: '0.55rem 0.65rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 9, color: '#fff', fontSize: '0.9rem', fontWeight: 600, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }
  const StepLabel = ({ n, children, first }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: first ? '0.25rem 0 0.85rem' : '2.75rem 0 0.85rem' }}>
      <span style={{ width: 24, height: 24, borderRadius: '50%', background: GOLD, color: '#0a0a0a', fontSize: '0.8rem', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{n}</span>
      <span style={{ fontSize: isMobile ? '0.98rem' : '1.08rem', fontWeight: 900, color: '#fff', lineHeight: 1.2 }}>{children}</span>
    </div>
  )
  const IngThumb = ({ ing }) => (
    <div style={{ width: 36, height: 36, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <img src={resolveFoodImage(ing)} alt={ing.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.currentTarget.style.display = 'none' }} />
    </div>
  )
  const MacroPill = ({ label, val, unit = 'g', big }) => (
    <div style={{ flex: 1, textAlign: 'center', padding: big ? '0.6rem 0.3rem' : '0.4rem 0.3rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10 }}>
      <div style={{ fontSize: big ? (isMobile ? '1.4rem' : '1.6rem') : '1.1rem', fontWeight: 900, color: label === 'kcal' ? GOLD : '#fff', lineHeight: 1 }}>{val}<span style={{ fontSize: '0.7rem', fontWeight: 700, opacity: 0.6, marginLeft: 1 }}>{unit}</span></div>
      <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', marginTop: 3 }}>{label}</div>
    </div>
  )

  return createPortal(
    <>
    <div style={{ position: 'fixed', inset: 0, zIndex: 2147483600, background: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: isMobile ? 'flex-end' : 'center', padding: isMobile ? 0 : '1.5rem' }}>
      <div style={{ width: '100%', maxWidth: 560, maxHeight: isMobile ? '95vh' : '90vh', background: '#0a0a0a', border: '1px solid rgba(255,215,0,0.2)', borderRadius: isMobile ? '18px 18px 0 0' : 18, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: isMobile ? '1rem' : '1.2rem 1.4rem', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: isMobile ? '1.25rem' : '1.45rem', fontWeight: 900, color: '#fff', margin: 0 }}>Bereken je meal prep macro's</h2>
          </div>
          <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={18} /></button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '0.85rem 1rem 1rem' : '1rem 1.4rem 1.4rem', WebkitOverflowScrolling: 'touch' }}>
          {/* ── Stap 1 — ingrediënten ── */}
          <StepLabel n={1} first>Voeg je totale ingrediënten toe</StepLabel>

          {/* Voeg ingrediënt toe — opent de zoek-modal */}
          <button onClick={() => { setSearch(''); setResults([]); setJustAdded(''); setShowSearch(true) }} style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: isMobile ? '0.85rem' : '0.95rem', borderRadius: 12, border: `1.5px dashed ${GOLD}55`,
            background: 'rgba(255,215,0,0.05)', color: GOLD, fontSize: isMobile ? '0.95rem' : '1rem', fontWeight: 800,
            cursor: 'pointer', marginBottom: '0.85rem', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          }}>
            <Plus size={18} strokeWidth={2.5} /> Voeg ingrediënt toe
          </button>

          <div style={{ fontSize: isMobile ? '0.95rem' : '1rem', color: 'rgba(255,255,255,0.8)', marginBottom: '0.85rem', fontWeight: 600, lineHeight: 1.4 }}>
            Vul per ingrediënt het <b style={{ color: '#fff' }}>totaal aantal gram</b> in dat je hebt klaargemaakt.
          </div>

          {/* Gekozen ingrediënten — foto links + totaal-grammen */}
          {rows.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '1.25rem', color: 'rgba(255,255,255,0.4)', fontSize: '0.95rem', fontWeight: 600 }}>Zoek hierboven je ingrediënten en voeg ze toe.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {rows.map(rw => (
                <div key={rw.ing.id} style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', padding: '0.4rem 0.5rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 9 }}>
                  <IngThumb ing={rw.ing} />
                  <span style={{ flex: 1, minWidth: 0, fontSize: '0.95rem', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{rw.ing.name}</span>
                  <input type="number" inputMode="numeric" value={rw.grams} onChange={e => setGrams(rw.ing.id, e.target.value)} style={{ ...inputStyle, width: 82, textAlign: 'right', fontSize: '1rem', fontWeight: 800, padding: '0.35rem 0.4rem' }} />
                  <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', fontWeight: 800 }}>g</span>
                  <button onClick={() => removeIng(rw.ing.id)} style={{ width: 26, height: 26, borderRadius: 7, background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={13} /></button>
                </div>
              ))}
            </div>
          )}

          {/* ── Stap 2 — bakjes (geen vak, gouden +/− knoppen) ── */}
          <StepLabel n={2}>In hoeveel bakjes verdeel je het?</StepLabel>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', marginBottom: '1.2rem' }}>
            <button onClick={() => setBakjes(b => Math.max(1, (parseInt(b, 10) || 1) - 1))} style={{ width: 46, height: 46, borderRadius: 12, background: GOLD, border: 'none', color: '#0a0a0a', fontSize: '1.7rem', fontWeight: 900, cursor: 'pointer', lineHeight: 1 }}>−</button>
            <div style={{ textAlign: 'center', minWidth: 84 }}>
              <input type="number" inputMode="numeric" value={bakjes} onChange={e => setBakjes(e.target.value)} style={{ ...inputStyle, width: 84, textAlign: 'center', fontSize: '2.3rem', fontWeight: 900, padding: '0.1rem', background: 'transparent', border: 'none' }} />
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'rgba(255,255,255,0.6)' }}>bakjes</div>
            </div>
            <button onClick={() => setBakjes(b => (parseInt(b, 10) || 1) + 1)} style={{ width: 46, height: 46, borderRadius: 12, background: GOLD, border: 'none', color: '#0a0a0a', fontSize: '1.7rem', fontWeight: 900, cursor: 'pointer', lineHeight: 1 }}>+</button>
          </div>

          {/* Per bakje — het resultaat */}
          <div style={{ fontSize: isMobile ? '1rem' : '1.1rem', fontWeight: 900, color: '#fff', marginBottom: '0.6rem' }}>Macro's per bakje <span style={{ color: GOLD }}>({n}×)</span></div>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.6rem' }}>
            <MacroPill label="kcal" val={Math.round(per.calories)} unit="" big />
            <MacroPill label="eiwit" val={r(per.protein)} big />
            <MacroPill label="kh" val={r(per.carbs)} big />
            <MacroPill label="vet" val={r(per.fat)} big />
          </div>
          <div style={{ fontSize: isMobile ? '0.9rem' : '0.95rem', color: 'rgba(255,255,255,0.55)', textAlign: 'center', fontWeight: 600 }}>
            Totale prep: {Math.round(total.calories)} kcal · {r(total.protein)}e {r(total.carbs)}k {r(total.fat)}v
          </div>

          {/* ── Stap 3 — opslaan ── */}
          <StepLabel n={3}>Sla je maaltijd op</StepLabel>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Naam (bv. Kip-rijst bakje)" style={{ ...inputStyle, width: '100%', marginBottom: '0.6rem' }} />
          {savedMsg && <div style={{ fontSize: '0.92rem', fontWeight: 700, color: savedMsg.startsWith('Opslaan mislukt') ? '#ef4444' : GREEN_OK, marginBottom: '0.6rem', lineHeight: 1.4 }}>{savedMsg}</div>}
          <button onClick={onSaveClick} disabled={saving || rows.length === 0 || !name.trim()} style={{ width: '100%', padding: '0.9rem', borderRadius: 12, border: 'none', background: (saving || rows.length === 0 || !name.trim()) ? 'rgba(255,215,0,0.35)' : 'linear-gradient(135deg,#FFD700,#D4AF37)', color: '#0a0a0a', fontSize: '1rem', fontWeight: 900, cursor: saving ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
            <Check size={17} /> {saving ? 'Opslaan…' : 'Voeg maaltijd toe'}
          </button>
        </div>
      </div>
    </div>

    {/* Zoek-modal — toevoegen via een knop, hier ingrediënten kiezen */}
    {showSearch && (
      <div onClick={() => setShowSearch(false)} style={{ position: 'fixed', inset: 0, zIndex: 2147483610, background: 'rgba(0,0,0,0.9)', display: 'flex', justifyContent: 'center', alignItems: isMobile ? 'flex-start' : 'center', padding: isMobile ? 0 : '1.5rem' }}>
        {/* Top-anchored op mobile: het zoekveld blijft bovenaan zichtbaar wanneer
            het toetsenbord opent (anders duwt het toetsenbord het veld weg). */}
        <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 520, maxHeight: isMobile ? '92vh' : '80vh', marginTop: isMobile ? 'env(safe-area-inset-top, 0px)' : 0, background: '#0a0a0a', border: '1px solid rgba(255,215,0,0.2)', borderRadius: isMobile ? '0 0 18px 18px' : 18, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: isMobile ? '0.9rem 1rem' : '1rem 1.2rem', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
              <input ref={searchInputRef} autoFocus value={search} onChange={e => { setSearch(e.target.value); if (justAdded) setJustAdded('') }} placeholder="Zoek ingrediënt…" style={{ ...inputStyle, width: '100%', paddingLeft: '2rem', fontSize: '1rem' }} />
            </div>
            <button onClick={() => setShowSearch(false)} style={{ flexShrink: 0, padding: '0.55rem 0.95rem', borderRadius: 10, border: 'none', background: GOLD, color: '#0a0a0a', fontSize: '0.9rem', fontWeight: 900, cursor: 'pointer' }}>Klaar{rows.length > 0 ? ` (${rows.length})` : ''}</button>
          </div>
          {/* Feedback: net toegevoegd → moedig aan om volgende te zoeken */}
          {justAdded && !search.trim() && (
            <div style={{ padding: '0.6rem 1rem', background: 'rgba(16,185,129,0.1)', borderBottom: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Check size={15} color={GREEN_OK} strokeWidth={3} />
              <span style={{ fontSize: '0.88rem', fontWeight: 700, color: GREEN_OK }}>
                {justAdded} toegevoegd — zoek je volgende ingrediënt
              </span>
            </div>
          )}
          <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
            {loading ? <div style={{ padding: '1.2rem', color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem', textAlign: 'center' }}>Zoeken…</div>
              : !search.trim() ? <div style={{ padding: '1.5rem', color: 'rgba(255,255,255,0.35)', fontSize: '0.9rem', textAlign: 'center', fontWeight: 500 }}>Typ om te zoeken — typefouten mogen.</div>
              : results.length === 0 ? <div style={{ padding: '1.5rem', color: 'rgba(255,255,255,0.35)', fontSize: '0.9rem', textAlign: 'center', fontWeight: 500 }}>Niks gevonden voor "{search}".</div>
              : results.map(ing => {
                  const added = rows.some(rw => rw.ing.id === ing.id)
                  return (
                    <button key={ing.id} onClick={() => addIng(ing)} disabled={added} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.7rem', padding: '0.7rem 0.9rem', background: added ? 'rgba(255,215,0,0.06)' : 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#fff', cursor: added ? 'default' : 'pointer', textAlign: 'left' }}>
                      <IngThumb ing={ing} />
                      <span style={{ flex: 1, fontSize: '0.95rem', fontWeight: 700 }}>{ing.name}</span>
                      <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>{Math.round(ing.calories_per_100g || 0)} kcal/100g</span>
                      {added ? <Check size={17} color={GOLD} /> : <Plus size={17} color={GOLD} />}
                    </button>
                  )
                })}
          </div>
        </div>
      </div>
    )}

    {/* Foto-stap — verschijnt bij opslaan; daarna sluit de modal direct */}
    {showPhotoStep && (
      <div style={{ position: 'fixed', inset: 0, zIndex: 2147483620, background: 'rgba(0,0,0,0.92)', display: 'flex', justifyContent: 'center', alignItems: isMobile ? 'flex-end' : 'center', padding: isMobile ? 0 : '1.5rem' }}>
        <div style={{ width: '100%', maxWidth: 460, background: '#0a0a0a', border: '1px solid rgba(255,215,0,0.2)', borderRadius: isMobile ? '18px 18px 0 0' : 18, padding: isMobile ? '1.25rem 1.1rem 1.5rem' : '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <h3 style={{ margin: 0, fontSize: isMobile ? '1.2rem' : '1.35rem', fontWeight: 900, color: '#fff' }}>Voeg een foto toe</h3>
            <button onClick={() => { if (!saving && !photoUploading) { setShowPhotoStep(false) } }} style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={17} /></button>
          </div>
          <p style={{ margin: '0 0 1rem', fontSize: '0.9rem', color: 'rgba(255,255,255,0.55)', fontWeight: 500 }}>Maak je maaltijd herkenbaar (optioneel).</p>

          {photoPreview ? (
            <div style={{ position: 'relative', width: '100%', height: isMobile ? 180 : 200, borderRadius: 12, overflow: 'hidden', marginBottom: '1rem', background: 'rgba(255,255,255,0.04)' }}>
              <img src={photoPreview} alt="Maaltijd" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              {photoUploading && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: GOLD, fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Uploaden…</div>}
              <button onClick={() => { setPhotoFile(null); setPhotoPreview(null) }} disabled={photoUploading} style={{ position: 'absolute', top: 8, right: 8, width: 32, height: 32, borderRadius: 8, background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={15} /></button>
            </div>
          ) : (
            <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, height: isMobile ? 120 : 140, borderRadius: 12, border: `1.5px dashed ${GOLD}55`, background: 'rgba(255,215,0,0.05)', cursor: 'pointer', marginBottom: '1rem', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
              <ImageIcon size={26} color={GOLD} strokeWidth={1.8} />
              <span style={{ fontSize: '0.9rem', fontWeight: 800, color: GOLD }}>Kies een foto</span>
              <input type="file" accept="image/*" onChange={handlePhotoSelect} style={{ display: 'none' }} />
            </label>
          )}

          {savedMsg && <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ef4444', marginBottom: '0.7rem', lineHeight: 1.4 }}>{savedMsg}</div>}

          <button onClick={confirmSave} disabled={saving || photoUploading} style={{ width: '100%', padding: '0.9rem', borderRadius: 12, border: 'none', background: (saving || photoUploading) ? 'rgba(255,215,0,0.35)' : 'linear-gradient(135deg,#FFD700,#D4AF37)', color: '#0a0a0a', fontSize: '1rem', fontWeight: 900, cursor: (saving || photoUploading) ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
            <Check size={17} /> {(saving || photoUploading) ? 'Opslaan…' : (photoPreview ? 'Opslaan met foto' : 'Opslaan')}
          </button>
          {!photoPreview && (
            <button onClick={() => doSave(null)} disabled={saving} style={{ width: '100%', marginTop: '0.55rem', padding: '0.6rem', borderRadius: 10, background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.45)', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}>
              Opslaan zonder foto
            </button>
          )}
        </div>
      </div>
    )}
    </>,
    document.body
  )
}

const GREEN_OK = '#10b981'
