// src/modules/ai-meal-generator/tabs/plan-analyzer/MealMakerModal.jsx
//
// Maaltijd vanaf nul bouwen, vanuit de Plan Analyzer.
//
// "Toevoegen" zoekt een bestaande maaltijd; dit scherm maakt er een. Je
// zoekt ingrediënten, zet er grammen bij, en de macro's tellen live mee.
// Zelf macro's intypen kan bewust niet: dan zou het plan getallen tonen die
// niet bij de ingrediënten horen, en de portie-schaler heeft de losse
// ingrediënten nodig om te kunnen rekenen.
//
// Opslaan schrijft naar ai_meals — dezelfde tabel waar de maaltijdkiezer uit
// leest. Wat je hier maakt kun je dus daarna gewoon terugvinden en bij een
// andere klant hergebruiken.

import React, { useState, useEffect, useRef } from 'react'
import { X, Plus, Trash2, Search, Loader, Check } from 'lucide-react'

const GOLD = '#FFD700'

// Slot → meal_type/timing, gelijk aan de indeling die de kiezer gebruikt.
const SLOT_TO_TYPE = { breakfast: 'breakfast', lunch: 'lunch', dinner: 'dinner' }
const slotType = (slot) => SLOT_TO_TYPE[slot] || 'snack'

const SLOT_LABEL = {
  breakfast: 'Ontbijt', lunch: 'Lunch', dinner: 'Diner',
  snack1: 'Snack 1', snack2: 'Snack 2', snack3: 'Snack 3',
  snack4: 'Snack 4', snack5: 'Snack 5', snack6: 'Snack 6',
  snack7: 'Snack 7', snack8: 'Snack 8', pre_workout: 'Pre-workout',
}

// Macro's van één regel: per 100 gram maal het aantal grammen.
const regelMacros = (ing, gram) => {
  const f = (Number(gram) || 0) / 100
  return {
    calories: (Number(ing.calories_per_100g) || 0) * f,
    protein: (Number(ing.protein_per_100g) || 0) * f,
    carbs: (Number(ing.carbs_per_100g) || 0) * f,
    fat: (Number(ing.fat_per_100g) || 0) * f,
    fiber: (Number(ing.fiber_per_100g) || 0) * f,
  }
}

export default function MealMakerModal({
  db, slot, isMobile, embedded = false, onSaved, onClose,
}) {
  const m = isMobile
  const [naam, setNaam] = useState('')
  const [regels, setRegels] = useState([])      // { ingredient, gram }
  const [zoek, setZoek] = useState('')
  const [treffers, setTreffers] = useState([])
  const [zoekBezig, setZoekBezig] = useState(false)
  const [opslaan, setOpslaan] = useState(false)
  const [fout, setFout] = useState(null)
  const zoekRef = useRef(0)

  // Zoeken met een korte pauze, en met een volgnummer erbij. Zonder dat
  // volgnummer kan een traag antwoord op "kip" een sneller antwoord op
  // "kipfilet" overschrijven en zie je de verkeerde lijst.
  useEffect(() => {
    const term = zoek.trim()
    if (term.length < 2) { setTreffers([]); return }
    const eigen = ++zoekRef.current
    setZoekBezig(true)
    const t = setTimeout(async () => {
      try {
        const { data } = await db.supabase
          .from('ai_ingredients')
          .select('id, name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, fiber_per_100g, default_portion_gram')
          .ilike('name', `%${term}%`)
          .limit(25)
        if (eigen === zoekRef.current) setTreffers(data || [])
      } catch (e) {
        console.error('ingrediënten zoeken mislukt:', e)
        if (eigen === zoekRef.current) setTreffers([])
      } finally {
        if (eigen === zoekRef.current) setZoekBezig(false)
      }
    }, 250)
    return () => clearTimeout(t)
  }, [zoek, db])

  const voegToe = (ing) => {
    setRegels(prev => prev.some(r => r.ingredient.id === ing.id)
      ? prev
      : [...prev, { ingredient: ing, gram: ing.default_portion_gram || 100 }])
    setZoek(''); setTreffers([])
  }

  const totaal = regels.reduce((t, r) => {
    const macro = regelMacros(r.ingredient, r.gram)
    return {
      calories: t.calories + macro.calories,
      protein: t.protein + macro.protein,
      carbs: t.carbs + macro.carbs,
      fat: t.fat + macro.fat,
      fiber: t.fiber + macro.fiber,
    }
  }, { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 })

  const kanOpslaan = naam.trim().length >= 2 && regels.length > 0 && totaal.calories > 0

  const bewaar = async () => {
    if (!kanOpslaan || opslaan) return
    setOpslaan(true); setFout(null)
    try {
      // Alleen kolommen die in ai_meals bestaan. Een onbekende kolom laat
      // PostgREST de hele insert weigeren, niet alleen dat ene veld.
      const rij = {
        name: naam.trim(),
        calories: Math.round(totaal.calories),
        protein: Math.round(totaal.protein * 10) / 10,
        carbs: Math.round(totaal.carbs * 10) / 10,
        fat: Math.round(totaal.fat * 10) / 10,
        fiber: Math.round(totaal.fiber * 10) / 10,
        ingredients_list: regels.map(r => ({
          ingredient_id: r.ingredient.id,
          amount: Number(r.gram) || 0,
          unit: 'gram',
        })),
        meal_type: slotType(slot),
        timing: [slotType(slot)],
      }
      const { data, error } = await db.supabase
        .from('ai_meals').insert([rij]).select('*').single()
      if (error || !data?.id) throw (error || new Error('geen id teruggegeven'))

      // Terug in de vorm die het plan verwacht: meal_id wijst naar de rij in
      // ai_meals, net als bij een maaltijd die je via de kiezer uitzoekt.
      onSaved?.({ ...data, meal_id: data.id })
    } catch (e) {
      console.error('maaltijd maken mislukt:', e)
      setFout(e.message || 'Opslaan mislukt')
      setOpslaan(false)
    }
  }

  const buiten = embedded
    ? { display: 'flex', flexDirection: 'column', width: '100%', height: '100%', minHeight: 0, background: '#0a0a0a' }
    : {
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)',
        zIndex: 10000, display: 'flex', alignItems: 'stretch', justifyContent: 'center',
        padding: m ? 0 : 'min(40px, 4vh) 20px',
      }

  return (
    <div style={buiten}>
      <div style={{
        display: 'flex', flexDirection: 'column', minHeight: 0,
        width: '100%', maxWidth: embedded ? 'none' : 560,
        height: embedded ? '100%' : 'auto', flex: embedded ? 1 : undefined,
        background: '#0a0a0a', overflow: 'hidden',
      }}>
        {/* Kop */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0.6rem 0.8rem', borderBottom: `1px solid rgba(255,215,0,0.2)`, flexShrink: 0,
        }}>
          <span style={{ color: GOLD, fontWeight: 800, fontSize: m ? '0.85rem' : '0.9rem' }}>
            {SLOT_LABEL[slot] || slot} maken
          </span>
          <button onClick={onClose} style={{
            width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 7, color: 'rgba(255,255,255,0.6)', cursor: 'pointer',
          }}><X size={15} /></button>
        </div>

        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '0.8rem' }}>
          {/* Naam */}
          <input
            value={naam}
            onChange={e => setNaam(e.target.value)}
            placeholder="Naam van de maaltijd"
            style={{
              width: '100%', padding: '0.6rem 0.7rem', marginBottom: '0.7rem',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6,
              color: '#fff', fontSize: '0.85rem', fontWeight: 800,
              fontFamily: 'inherit', outline: 'none',
            }}
          />

          {/* Ingrediënt zoeken */}
          <div style={{ position: 'relative', marginBottom: '0.7rem' }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
            <input
              value={zoek}
              onChange={e => setZoek(e.target.value)}
              placeholder="Ingrediënt zoeken…"
              style={{
                width: '100%', padding: '0.55rem 0.7rem 0.55rem 1.9rem',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6,
                color: '#fff', fontSize: '0.78rem', fontFamily: 'inherit', outline: 'none',
              }}
            />
            {zoekBezig && <Loader size={13} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: GOLD, animation: 'spin 1s linear infinite' }} />}
          </div>

          {treffers.length > 0 && (
            <div style={{ marginBottom: '0.7rem', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, overflow: 'hidden' }}>
              {treffers.map(ing => (
                <button key={ing.id} onClick={() => voegToe(ing)} style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem',
                  padding: '0.5rem 0.7rem', background: 'rgba(255,255,255,0.02)',
                  borderTop: 'none', borderBottom: '1px solid rgba(255,255,255,0.05)',
                  borderLeft: 'none', borderRight: 'none',
                  cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fff' }}>{ing.name}</span>
                  <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.35)', flexShrink: 0 }}>
                    {Math.round(ing.calories_per_100g || 0)} kcal/100g
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Gekozen ingrediënten */}
          {regels.length === 0 ? (
            <div style={{ padding: '1.5rem 0', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem' }}>
              Zoek hierboven een ingrediënt om te beginnen.
            </div>
          ) : regels.map((r, i) => {
            const macro = regelMacros(r.ingredient, r.gram)
            return (
              <div key={r.ingredient.id} style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)',
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.ingredient.name}
                  </div>
                  <div style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.35)' }}>
                    {Math.round(macro.calories)} kcal · {Math.round(macro.protein)}p · {Math.round(macro.carbs)}k · {Math.round(macro.fat)}v
                  </div>
                </div>
                <input
                  type="number" min="0" inputMode="numeric"
                  value={r.gram}
                  onChange={e => setRegels(prev => prev.map((x, j) => j === i ? { ...x, gram: e.target.value } : x))}
                  style={{
                    width: 62, padding: '0.35rem 0.4rem', textAlign: 'right',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.12)', borderRadius: 5,
                    color: '#fff', fontSize: '0.75rem', fontWeight: 800,
                    fontFamily: 'inherit', outline: 'none',
                  }}
                />
                <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)' }}>g</span>
                <button onClick={() => setRegels(prev => prev.filter((_, j) => j !== i))} style={{
                  width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'none', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 5,
                  color: '#ef4444', cursor: 'pointer', flexShrink: 0,
                }}><Trash2 size={12} /></button>
              </div>
            )
          })}
        </div>

        {/* Totaal + opslaan. Onderaan vastgezet zodat de knop niet onder het
            scherm valt zodra je een paar ingrediënten hebt. */}
        <div style={{ flexShrink: 0, borderTop: '1px solid rgba(255,255,255,0.08)', padding: '0.7rem 0.8rem' }}>
          <div style={{ display: 'flex', gap: '0.8rem', marginBottom: '0.6rem' }}>
            {[
              ['kcal', Math.round(totaal.calories)],
              ['eiwit', `${Math.round(totaal.protein)}g`],
              ['kh', `${Math.round(totaal.carbs)}g`],
              ['vet', `${Math.round(totaal.fat)}g`],
            ].map(([label, waarde]) => (
              <div key={label}>
                <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' }}>{label}</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 900, color: '#fff' }}>{waarde}</div>
              </div>
            ))}
          </div>

          {fout && (
            <div style={{ marginBottom: '0.5rem', color: '#ef4444', fontSize: '0.68rem', fontWeight: 700 }}>{fout}</div>
          )}

          <button onClick={bewaar} disabled={!kanOpslaan || opslaan} style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
            padding: '0.7rem', background: kanOpslaan ? '#fff' : 'rgba(255,255,255,0.08)',
            borderTop: 'none', borderBottom: 'none', borderLeft: 'none', borderRight: 'none',
            borderRadius: 6,
            color: kanOpslaan ? '#0a0a0a' : 'rgba(255,255,255,0.3)',
            fontSize: '0.75rem', fontWeight: 900, fontFamily: 'inherit',
            cursor: (kanOpslaan && !opslaan) ? 'pointer' : 'default',
          }}>
            {opslaan
              ? <><Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Opslaan…</>
              : <><Check size={14} /> Opslaan en in het plan zetten</>}
          </button>
          <div style={{ marginTop: '0.4rem', fontSize: '0.58rem', color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>
            {regels.length === 0 ? 'Voeg eerst een ingrediënt toe' : !naam.trim() ? 'Geef de maaltijd een naam' : 'Blijft bewaard voor andere klanten'}
          </div>
        </div>
      </div>
    </div>
  )
}
