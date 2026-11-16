// src/modules/meal-plan/components/GeplandBlok.jsx
//
// Vrij loggen, maar toch vooruit plannen (13 nov 2026, Kersten): per dag de
// maaltijden die de klant alvast klaarzette, per eetmoment, met wat dat
// optelt tegen zijn doelen. Gepland is nog niet gegeten: het staat in
// geplande_maaltijden en telt nergens mee tot hij op "Gegeten" tikt. Dan gaat
// de rij naar consumed_meals, precies zoals bij gewoon loggen.

import { useCallback, useEffect, useState } from 'react'
import { Plus, Check, X } from 'lucide-react'
import { foodImageFallback } from '../foodImageFallback'

const MOMENTEN = [
  ['breakfast', 'Ontbijt', 'breakfast'], ['lunch', 'Lunch', 'lunch'], ['dinner', 'Diner', 'dinner'], ['snack', 'Snack', 'snack1'],
]
const som = (lijst) => lijst.reduce((t, r) => ({
  calories: t.calories + (Number(r.calories) || 0), protein: t.protein + (Number(r.protein) || 0),
  carbs: t.carbs + (Number(r.carbs) || 0), fat: t.fat + (Number(r.fat) || 0),
}), { calories: 0, protein: 0, carbs: 0, fat: 0 })
const rond = (n) => Math.round(Number(n) || 0)
// Hoeveelheid van een rij: losse producten staan in gram of ml, samengestelde
// maaltijden in porties.
const eenheidVan = (r) => {
  const u = String(r.per_unit || '').toLowerCase()
  if (u === 'gram' || u === 'g') return 'g'
  if (u === 'ml') return 'ml'
  if (u === 'portion' || u === 'portie' || !u) return 'portie'
  return u
}
const getal = (n) => String(Math.round((Number(n) || 0) * 10) / 10).replace('.', ',')
const hoeveelTekst = (r) => {
  const e = eenheidVan(r)
  return e === 'portie' ? `${getal(r.amount || 1)} ${Number(r.amount || 1) === 1 ? 'portie' : 'porties'}` : `${getal(r.amount)} ${e}`
}
const momentVan = (r) => (MOMENTEN.some(([m]) => m === r.meal_type) ? r.meal_type : 'snack')

// `datum` = 'jjjj-mm-dd' van de dag in beeld. `magLoggen` = vandaag of eerder
// (een dag in de toekomst kun je nog niet gegeten hebben).
// `versie` telt op als er elders iets gepland is; `onGelogd` laat het
// dagschema de gelogde maaltijden opnieuw ophalen.
// `onMomenten` meldt voor welke eetmomenten er iets gepland staat: het
// dagschema laat het lege vak van dat moment dan weg.
export default function GeplandBlok({ db, client, datum, magLoggen, versie = 0, onPlan, onGelogd, onMomenten = null, isMobile }) {
  const [rijen, setRijen] = useState([])
  const [bezig, setBezig] = useState(null)
  const [fout, setFout] = useState(null)
  // Opengeklapte rij: hoeveelheid aanpassen en de ingrediënten met gram zien
  // (16 nov 2026, feedback van een klant: vooraf gepland, maar hoeveel was het?).
  const [open, setOpen] = useState(null)
  const [invoer, setInvoer] = useState('')

  const laad = useCallback(async () => {
    if (!db?.supabase || !client?.id || !datum) return
    const { data, error } = await db.supabase.from('geplande_maaltijden')
      .select('id, meal_type, meal_name, calories, protein, carbs, fat, amount, per_unit, image_url, payload')
      .eq('client_id', client.id).eq('datum', datum).is('gelogd_id', null).order('created_at')
      .then(r => r, () => ({ data: [], error: null }))
    if (!error) setRijen(data || [])
  }, [db, client?.id, datum])
  useEffect(() => { laad() }, [laad, versie])
  useEffect(() => { onMomenten?.([...new Set(rijen.map(momentVan))]) }, [rijen]) // eslint-disable-line react-hooks/exhaustive-deps

  const weg = async (r) => {
    setBezig(r.id)
    await db.supabase.from('geplande_maaltijden').delete().eq('id', r.id)
    setBezig(null); laad()
  }

  // Andere hoeveelheid: kcal en macro's schalen mee, ook in de payload die
  // straks naar consumed_meals gaat, en in de ingrediënten.
  const bewaarHoeveel = async (r) => {
    const oud = Number(r.amount) || 1
    const nieuw = Number(String(invoer).replace(',', '.'))
    if (!(nieuw > 0) || nieuw === oud) { setOpen(null); return }
    const f = nieuw / oud
    const een = (n) => Math.round((Number(n) || 0) * f * 10) / 10
    const waarden = { amount: nieuw, calories: Math.round((Number(r.calories) || 0) * f), protein: een(r.protein), carbs: een(r.carbs), fat: een(r.fat) }
    const ingredienten = Array.isArray(r.payload?.ingredients)
      ? r.payload.ingredients.map(i => ({
        ...i, amount: een(i.amount),
        ...(i.calories != null ? { calories: Math.round((Number(i.calories) || 0) * f) } : {}),
        ...(i.protein != null ? { protein: een(i.protein) } : {}),
        ...(i.carbs != null ? { carbs: een(i.carbs) } : {}),
        ...(i.fat != null ? { fat: een(i.fat) } : {}),
      }))
      : r.payload?.ingredients
    setBezig(r.id); setFout(null)
    const { error } = await db.supabase.from('geplande_maaltijden')
      .update({ ...waarden, payload: { ...r.payload, ...waarden, ingredients: ingredienten }, updated_at: new Date().toISOString() })
      .eq('id', r.id)
    if (error) { console.error('Hoeveelheid aanpassen mislukt:', error); setFout('Aanpassen lukte niet. Probeer het nog eens.') }
    else setOpen(null)
    setBezig(null); laad()
  }

  // Gegeten: de rij gaat naar consumed_meals. Vandaag met de tijd van nu, een
  // eerdere dag op twaalf uur van die dag (zelfde regel als naloggen).
  const gegetenTik = async (r) => {
    setBezig(r.id); setFout(null)
    try {
      const nu = new Date()
      const vandaag = `${nu.getFullYear()}-${String(nu.getMonth() + 1).padStart(2, '0')}-${String(nu.getDate()).padStart(2, '0')}`
      const consumed_at = datum === vandaag ? nu.toISOString() : new Date(`${datum}T12:00:00`).toISOString()
      const { data, error } = await db.supabase.from('consumed_meals')
        .insert({ ...r.payload, client_id: client.id, consumed_at, created_at: nu.toISOString() }).select('id').single()
      if (error) throw error
      await db.supabase.from('geplande_maaltijden').update({ gelogd_id: data.id, updated_at: nu.toISOString() }).eq('id', r.id)
      if (navigator.vibrate) navigator.vibrate([20, 40, 20])
      await laad()
      // De gelogde rij gaat mee: de pagina telt de macro's ervan bij het dagtotaal.
      onGelogd?.({ ...r.payload, id: data.id, consumed_at })
    } catch (e) {
      console.error('Geplande maaltijd loggen mislukt:', e)
      setFout('Loggen lukte niet. Probeer het nog eens.')
    }
    setBezig(null)
  }

  // Niets gepland: geen blok. Inplannen doe je op de lege vakken in het dagschema.
  if (rijen.length === 0) return null
  const zij = isMobile ? '0.9rem' : '1.25rem'
  const gepland = som(rijen)

  return (
    <div style={{ margin: `0 0 ${isMobile ? '0.6rem' : '0.8rem'}` }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, margin: `0 ${zij} 4px` }}>
        <span style={{ fontSize: isMobile ? '1rem' : '1.1rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>Gepland</span>
        {rijen.length > 0 && (
          <span style={{ flex: 1, minWidth: 0, fontSize: '0.74rem', fontWeight: 800, color: 'rgba(255,255,255,0.6)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {rond(gepland.calories)} kcal · {rond(gepland.protein)} E · {rond(gepland.carbs)} K · {rond(gepland.fat)} V
          </span>
        )}
      </div>

      {MOMENTEN.map(([moment, label, slot]) => {
        const items = rijen.filter(r => momentVan(r) === moment)
        if (!items.length) return null
        return (
          <div key={moment} style={{ margin: `0 ${isMobile ? '0.5rem' : '0.75rem'} 0.4rem`, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 40, padding: '0 0.4rem 0 0.75rem' }}>
              <span style={{ fontSize: '0.84rem', fontWeight: 900, color: '#fff' }}>{label}</span>
              <span style={{ flex: 1, minWidth: 0, fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)', fontVariantNumeric: 'tabular-nums' }}>
                {items.length ? `${rond(som(items).calories)} kcal` : 'nog niets gepland'}
              </span>
              {onPlan && (
                <button onClick={() => onPlan(moment)} aria-label={`${label} plannen`} style={{ width: 36, height: 36, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', touchAction: 'manipulation' }}>
                  <Plus size={18} strokeWidth={2.8} />
                </button>
              )}
            </div>
            {items.map(r => {
              const isOpen = open === r.id
              const eenheid = eenheidVan(r)
              const ingredienten = (Array.isArray(r.payload?.ingredients) ? r.payload.ingredients : []).filter(i => i?.name)
              return (
                <div key={r.id} style={{ borderTop: '1px solid rgba(255,255,255,0.05)', opacity: bezig === r.id ? 0.5 : 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.35rem 0.4rem 0.35rem 0.5rem' }}>
                    <div style={{ width: 40, height: 40, flexShrink: 0, borderRadius: 8, background: `url(${r.image_url || foodImageFallback(r.meal_name, slot, 120)}) center/cover` }} />
                    {/* Tik op de naam: hoeveelheid aanpassen en ingrediënten zien. */}
                    <div onClick={() => { setOpen(isOpen ? null : r.id); setInvoer(getal(r.amount || 1)) }} style={{ flex: 1, minWidth: 0, cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
                      <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.meal_name}</div>
                      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        <span style={{ fontWeight: 900, color: '#fff' }}>{hoeveelTekst(r)}</span> · {rond(r.calories)} kcal · {rond(r.protein)} E · {rond(r.carbs)} K · {rond(r.fat)} V
                      </div>
                    </div>
                    {magLoggen && (
                      <button onClick={() => gegetenTik(r)} disabled={bezig === r.id} style={{ flexShrink: 0, height: 32, padding: '0 0.7rem', display: 'flex', alignItems: 'center', gap: 5, borderRadius: 9, background: '#fff', border: 'none', color: '#0a0a0a', fontFamily: 'inherit', fontSize: '0.74rem', fontWeight: 900, cursor: 'pointer', touchAction: 'manipulation' }}>
                        <Check size={13} strokeWidth={3} /> Gegeten
                      </button>
                    )}
                    <button onClick={() => weg(r)} disabled={bezig === r.id} aria-label="Weghalen" style={{ width: 32, height: 32, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
                      <X size={16} />
                    </button>
                  </div>
                  {isOpen && (
                    <div style={{ padding: '0 0.5rem 0.55rem calc(0.5rem + 48px)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <input
                          value={invoer} onChange={(e) => setInvoer(e.target.value)} inputMode="decimal" autoFocus
                          onKeyDown={(e) => { if (e.key === 'Enter') bewaarHoeveel(r) }}
                          aria-label="Hoeveelheid"
                          style={{ width: 84, height: 36, boxSizing: 'border-box', padding: '0 0.6rem', borderRadius: 9, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)', color: '#fff', fontFamily: 'inherit', fontSize: '16px', fontWeight: 900, fontVariantNumeric: 'tabular-nums', outline: 'none' }}
                        />
                        <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'rgba(255,255,255,0.6)' }}>{eenheid === 'portie' ? 'porties' : eenheid === 'g' ? 'gram' : eenheid}</span>
                        <button onClick={() => bewaarHoeveel(r)} disabled={bezig === r.id} style={{ marginLeft: 'auto', height: 36, padding: '0 0.9rem', borderRadius: 9, background: '#fff', border: 'none', color: '#0a0a0a', fontFamily: 'inherit', fontSize: '0.76rem', fontWeight: 900, cursor: 'pointer', touchAction: 'manipulation' }}>
                          Opslaan
                        </button>
                      </div>
                      {ingredienten.length > 0 && (
                        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 3 }}>
                          {ingredienten.map((i, n) => (
                            <div key={i.id || i.ingredient_id || n} style={{ display: 'flex', gap: 8, fontSize: '0.74rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>
                              <span style={{ flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{i.name}</span>
                              <span style={{ flexShrink: 0, fontWeight: 900, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>{getal(i.amount)} {/^(g|gram)$/i.test(i.unit || '') ? 'g' : (i.unit || '')}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )
      })}
      {fout && <div style={{ margin: `4px ${zij} 0`, fontSize: '0.74rem', fontWeight: 800, color: '#ef4444' }}>{fout}</div>}
    </div>
  )
}
