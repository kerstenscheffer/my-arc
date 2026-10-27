// src/modules/meal-plan/components/MealPrepCalculator.jsx
// Meal-prep rekenhulp (issue 0f689436): je hebt net meal-prepped → voer in
// hoeveel van elk ingrediënt erin ging (totaal in gram) en in hoeveel bakjes je
// het verdeelt. De calculator laat de macro's PER BAKJE zien en slaat dat als
// maaltijd op in je Quick log (ai_custom_meals), zodat je 1 bakje makkelijk logt.
import { useState, useEffect, useRef } from 'react'
import { createPortal } from '../../../client/paginaPortal'
import { X, Search, Plus, Trash2, Check, Image as ImageIcon } from 'lucide-react'
import { resolveFoodImage } from '../foodImageFallback'

const r = (n) => Math.round((Number(n) || 0) * 10) / 10

export default function MealPrepCalculator({ client, db, onClose, onSaved }) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768
  const [search, setSearch] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState([])          // { ing, grams }
  const [bakjes, setBakjes] = useState(4)
  const [name, setName] = useState('')
  // Wanneer eet je een bakje? Verplicht: daarmee staat hij in het wisselscherm
  // onder het juiste moment. Waarden zoals oude app-versies ze kennen.
  const [sectie, setSectie] = useState('')
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [justAdded, setJustAdded] = useState('')   // naam van laatst toegevoegd ingrediënt (feedback)
  const searchInputRef = useRef(null)
  // Foto-stap bij opslaan
  const [showPhotoStep, setShowPhotoStep] = useState(false)
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  // Tijdelijke blob-URL van de vorige/laatste foto vrijgeven (anders blijft
  // de hele foto in het geheugen tot de app sluit).
  useEffect(() => () => { if (typeof photoPreview === 'string' && photoPreview.startsWith('blob:')) URL.revokeObjectURL(photoPreview) }, [photoPreview])
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
    if (!name.trim() || rows.length === 0 || !sectie) { setSavedMsg('Opslaan mislukt: geef een naam, ingrediënten en een moment.'); return }
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
        meal_type: [{ ontbijt: 'breakfast', lunch: 'lunch', diner: 'dinner', pre_workout: 'pre_workout' }[sectie] || 'snack'],
        section: sectie,
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

  // Stijl gelijk aan het portiescherm van loggen (27 okt 2026): geen goud,
  // geen vakjes of stapnummers, macro's als losse getallen met een stipje.
  const kopje = { fontSize: '0.62rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '1.6rem 0 0.6rem' }
  const plusMin = { width: 44, height: 52, padding: 0, background: 'none', border: 'none', color: 'rgba(255,255,255,0.85)', fontSize: '2.2rem', fontWeight: 800, lineHeight: 1, fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }
  const kaal = { background: 'none', border: 'none', padding: 0, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }
  const veld = { padding: '0.7rem 0.85rem', background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 12, color: '#fff', fontSize: '0.95rem', fontWeight: 700, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }
  const witKnop = (uit) => ({ width: '100%', minHeight: 50, borderRadius: 12, border: 'none', background: uit ? 'rgba(255,255,255,0.15)' : '#fff', color: uit ? 'rgba(255,255,255,0.5)' : '#0a0a0a', fontSize: '0.95rem', fontWeight: 900, fontFamily: 'inherit', cursor: uit ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' })
  const IngThumb = ({ ing }) => (
    <div style={{ width: 38, height: 38, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: 'rgba(255,255,255,0.06)' }}>
      <img src={resolveFoodImage(ing)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.currentTarget.style.display = 'none' }} />
    </div>
  )
  const kanOpslaan = !saving && rows.length > 0 && !!name.trim() && !!sectie
  const MOMENTEN = [
    { id: 'ontbijt', label: 'Ontbijt' }, { id: 'lunch', label: 'Lunch' }, { id: 'diner', label: 'Diner' },
    { id: 'snack', label: 'Snack' }, { id: 'pre_workout', label: 'Pre-workout' },
  ]
  const sheet = (zIndex, children, onBuiten) => (
    <div onClick={onBuiten} style={{ position: 'fixed', inset: 0, zIndex, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div onClick={e => e.stopPropagation()} style={{ position: 'relative', width: '100%', maxWidth: 560, margin: '0 auto', maxHeight: '94vh', background: '#0a0a0a', borderTop: '1px solid rgba(255,255,255,0.1)', borderTopLeftRadius: 22, borderTopRightRadius: 22, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ width: 38, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.18)', margin: '8px auto 0', flexShrink: 0 }} />
        {children}
      </div>
    </div>
  )

  return createPortal(
    <>
    {sheet(2147483600, (
      <>
        {/* Kop: titel en een los kruisje */}
        <div style={{ display: 'flex', alignItems: 'center', padding: isMobile ? '0.5rem 0.6rem 0.25rem 1rem' : '0.6rem 0.9rem 0.3rem 1.4rem', flexShrink: 0 }}>
          <div style={{ flex: 1, fontSize: isMobile ? '1.2rem' : '1.35rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.025em' }}>Meal prep</div>
          <button onClick={onClose} aria-label="Sluiten" style={{ ...kaal, width: 40, height: 40 }}><X size={22} strokeWidth={2.4} /></button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '0 1rem 1rem' : '0 1.4rem 1.2rem', WebkitOverflowScrolling: 'touch' }}>
          {/* Ingrediënten: alles wat erin ging, in totaal-grammen */}
          <div style={{ ...kopje, marginTop: '0.6rem', display: 'flex', justifyContent: 'space-between' }}>
            <span>Wat ging erin</span>{rows.length > 0 && <span>Totaal</span>}
          </div>
          {rows.map(rw => (
            <div key={rw.ing.id} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <IngThumb ing={rw.ing} />
              <span style={{ flex: 1, minWidth: 0, fontSize: '0.92rem', fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{rw.ing.name}</span>
              <input type="number" inputMode="numeric" value={rw.grams} onChange={e => setGrams(rw.ing.id, e.target.value)}
                style={{ width: 64, background: 'none', border: 'none', borderBottom: '1.5px solid rgba(255,255,255,0.3)', borderRadius: 0, color: '#fff', fontSize: '1.05rem', fontWeight: 900, textAlign: 'right', outline: 'none', fontFamily: 'inherit', padding: '0.15rem 0' }} />
              <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', fontWeight: 800, marginLeft: -4 }}>g</span>
              <button onClick={() => removeIng(rw.ing.id)} aria-label="Weghalen" style={{ ...kaal, width: 28, height: 28, color: 'rgba(255,255,255,0.45)' }}><Trash2 size={15} /></button>
            </div>
          ))}
          <button onClick={() => { setSearch(''); setResults([]); setJustAdded(''); setShowSearch(true) }} style={{
            ...kaal, width: '100%', gap: 6, minHeight: 46, marginTop: rows.length ? '0.7rem' : 0,
            border: '1.5px solid rgba(255,255,255,0.28)', borderRadius: 12, fontSize: '0.88rem', fontWeight: 900,
          }}>
            <Plus size={16} strokeWidth={3} /> Ingrediënt
          </button>

          {/* Bakjes: − 4 + zoals porties bij loggen */}
          <div style={{ ...kopje, textAlign: 'center' }}>Verdeeld over</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
            <button aria-label="Minder" style={plusMin} onClick={() => setBakjes(b => Math.max(1, (parseInt(b, 10) || 1) - 1))}>−</button>
            <input type="number" inputMode="numeric" value={bakjes} onChange={e => setBakjes(e.target.value)}
              style={{ width: '2.2ch', background: 'none', border: 'none', outline: 'none', color: '#fff', fontSize: isMobile ? '3.2rem' : '3.6rem', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1, textAlign: 'center', fontFamily: 'inherit', padding: 0 }} />
            <button aria-label="Meer" style={plusMin} onClick={() => setBakjes(b => (parseInt(b, 10) || 1) + 1)}>+</button>
          </div>
          <div style={{ textAlign: 'center', fontSize: '1rem', fontWeight: 800, color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>bakjes</div>

          {/* Per bakje: vier getallen, geen vakken */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: isMobile ? 22 : 34, marginTop: '1.4rem', paddingTop: '1.1rem', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            {[
              { label: 'kcal', waarde: Math.round(per.calories), kleur: '#10b981' },
              { label: 'eiwit', waarde: `${Math.round(per.protein)}g`, kleur: '#3b82f6' },
              { label: 'koolh', waarde: `${Math.round(per.carbs)}g`, kleur: '#ec4899' },
              { label: 'vet', waarde: `${Math.round(per.fat)}g`, kleur: '#f59e0b' },
            ].map(m => (
              <div key={m.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: isMobile ? '1.3rem' : '1.45rem', fontWeight: 900, color: '#fff', lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>{m.waarde}</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, marginTop: 4, fontSize: '0.62rem', fontWeight: 800, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: m.kleur }} />{m.label}
                </div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginTop: '0.6rem' }}>
            per bakje · totaal {Math.round(total.calories)} kcal
          </div>

          {/* Naam */}
          <div style={kopje}>Naam</div>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Bv. Kip-rijst bakje" style={{ ...veld, width: '100%' }} />

          <div style={{ ...kopje, color: sectie ? 'rgba(255,255,255,0.4)' : '#fff' }}>Wanneer eet je hem?</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {MOMENTEN.map(o => {
              const aan = sectie === o.id
              return (
                <button key={o.id} onClick={() => setSectie(o.id)} style={{
                  height: 34, padding: '0 0.85rem', borderRadius: 999, border: 'none',
                  background: aan ? '#fff' : 'rgba(255,255,255,0.07)', color: aan ? '#0a0a0a' : 'rgba(255,255,255,0.75)',
                  fontSize: '0.8rem', fontWeight: 900, fontFamily: 'inherit', cursor: 'pointer',
                  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                }}>{o.label}</button>
              )
            })}
          </div>
          {savedMsg && <div style={{ fontSize: '0.8rem', fontWeight: 700, color: savedMsg.startsWith('Opslaan mislukt') ? '#ef4444' : GREEN_OK, marginTop: '0.6rem' }}>{savedMsg}</div>}
        </div>

        <div style={{ flexShrink: 0, padding: isMobile ? '0.6rem 1rem calc(1rem + env(safe-area-inset-bottom, 0px))' : '0.75rem 1.4rem 1.3rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={onSaveClick} disabled={!kanOpslaan} style={witKnop(!kanOpslaan)}>
            <Check size={16} strokeWidth={3} /> {saving ? 'Opslaan…' : 'Opslaan'}
          </button>
        </div>
      </>
    ), undefined)}

    {/* Ingrediënt zoeken. Bovenaan op mobiel: anders duwt het toetsenbord het veld weg. */}
    {showSearch && (
      <div onClick={() => setShowSearch(false)} style={{ position: 'fixed', inset: 0, zIndex: 2147483610, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'center', alignItems: isMobile ? 'flex-start' : 'center', padding: isMobile ? 0 : '1.5rem' }}>
        <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 520, maxHeight: isMobile ? '92vh' : '80vh', marginTop: isMobile ? 'env(safe-area-inset-top, 0px)' : 0, background: '#0a0a0a', borderBottom: '1px solid rgba(255,255,255,0.1)', borderRadius: isMobile ? '0 0 22px 22px' : 22, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: isMobile ? '0.75rem 0.75rem 0.6rem 1rem' : '0.9rem 1rem 0.7rem 1.2rem', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
              <input ref={searchInputRef} autoFocus value={search} onChange={e => { setSearch(e.target.value); if (justAdded) setJustAdded('') }} placeholder="Zoek ingrediënt" style={{ ...veld, width: '100%', paddingLeft: '2.2rem' }} />
            </div>
            <button onClick={() => setShowSearch(false)} style={{ flexShrink: 0, height: 40, padding: '0 1rem', borderRadius: 999, border: 'none', background: '#fff', color: '#0a0a0a', fontSize: '0.85rem', fontWeight: 900, fontFamily: 'inherit', cursor: 'pointer' }}>Klaar{rows.length > 0 ? ` (${rows.length})` : ''}</button>
          </div>
          {justAdded && !search.trim() && (
            <div style={{ padding: '0 1rem 0.6rem', display: 'flex', alignItems: 'center', gap: 7 }}>
              <Check size={14} color={GREEN_OK} strokeWidth={3} />
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#fff' }}>{justAdded} erbij</span>
            </div>
          )}
          <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            {loading ? <div style={{ padding: '1.2rem', color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', textAlign: 'center' }}>Zoeken…</div>
              : !search.trim() ? null
              : results.length === 0 ? <div style={{ padding: '1.5rem', color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', textAlign: 'center', fontWeight: 600 }}>Niks gevonden</div>
              : results.map(ing => {
                  const added = rows.some(rw => rw.ing.id === ing.id)
                  return (
                    <button key={ing.id} onClick={() => addIng(ing)} disabled={added} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.7rem', padding: '0.6rem 1rem', background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#fff', cursor: added ? 'default' : 'pointer', textAlign: 'left', fontFamily: 'inherit', opacity: added ? 0.5 : 1 }}>
                      <IngThumb ing={ing} />
                      <span style={{ flex: 1, minWidth: 0, fontSize: '0.92rem', fontWeight: 800 }}>{ing.name}</span>
                      <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)', fontWeight: 700, whiteSpace: 'nowrap' }}>{Math.round(ing.calories_per_100g || 0)} kcal</span>
                      {added ? <Check size={17} color="#fff" strokeWidth={3} /> : <Plus size={17} color="#fff" strokeWidth={3} />}
                    </button>
                  )
                })}
          </div>
        </div>
      </div>
    )}

    {/* Foto bij opslaan (optioneel); daarna sluit alles */}
    {showPhotoStep && sheet(2147483620, (
      <div style={{ padding: isMobile ? '0.6rem 1rem calc(1.2rem + env(safe-area-inset-bottom, 0px))' : '0.8rem 1.4rem 1.4rem', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.9rem' }}>
          <div style={{ flex: 1, fontSize: isMobile ? '1.2rem' : '1.3rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.025em' }}>Foto erbij?</div>
          <button onClick={() => { if (!saving && !photoUploading) setShowPhotoStep(false) }} aria-label="Sluiten" style={{ ...kaal, width: 40, height: 40 }}><X size={22} strokeWidth={2.4} /></button>
        </div>
        {photoPreview ? (
          <div style={{ position: 'relative', width: 140, height: 140, borderRadius: '50%', overflow: 'hidden', margin: '0 auto 1.1rem', background: 'rgba(255,255,255,0.04)' }}>
            <img src={photoPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            {photoUploading && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.75rem', fontWeight: 900 }}>Uploaden…</div>}
            <button onClick={() => { setPhotoFile(null); setPhotoPreview(null) }} disabled={photoUploading} aria-label="Foto weghalen" style={{ ...kaal, position: 'absolute', top: 10, right: 10, width: 30, height: 30, borderRadius: '50%', background: 'rgba(0,0,0,0.65)' }}><X size={15} /></button>
          </div>
        ) : (
          <label style={{ width: 140, height: 140, borderRadius: '50%', margin: '0 auto 1.1rem', border: '1.5px solid rgba(255,255,255,0.28)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer', color: '#fff', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
            <ImageIcon size={26} strokeWidth={2} />
            <span style={{ fontSize: '0.8rem', fontWeight: 900 }}>Kies foto</span>
            <input type="file" accept="image/*" onChange={handlePhotoSelect} style={{ display: 'none' }} />
          </label>
        )}
        {savedMsg && <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ef4444', marginBottom: '0.7rem', textAlign: 'center' }}>{savedMsg}</div>}
        <button onClick={confirmSave} disabled={saving || photoUploading} style={witKnop(saving || photoUploading)}>
          <Check size={16} strokeWidth={3} /> {(saving || photoUploading) ? 'Opslaan…' : (photoPreview ? 'Opslaan met foto' : 'Opslaan')}
        </button>
        {!photoPreview && (
          <button onClick={() => doSave(null)} disabled={saving} style={{ ...kaal, width: '100%', marginTop: '0.6rem', padding: '0.5rem', color: 'rgba(255,255,255,0.5)', fontSize: '0.82rem', fontWeight: 800 }}>
            Zonder foto
          </button>
        )}
      </div>
    ), () => { if (!saving && !photoUploading) setShowPhotoStep(false) })}
    </>,
    document.body
  )
}

const GREEN_OK = '#10b981'
