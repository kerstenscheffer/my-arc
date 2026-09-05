// src/modules/ai-meal-generator/tabs/plan-analyzer/VezelsMicros.jsx
//
// Vezels, natrium en micronutriënten van één dag, uitklapbaar.
//
// Vezels en natrium staan gewoon in de gegevens: alle 37.545 ingrediënten
// hebben ze. Micronutriënten liggen anders. Die zitten in
// ai_ingredients.vitamins_minerals, maar dat veld is bij 1.574 ingrediënten
// gevuld — en van de 231 ingrediënten die daadwerkelijk in maaltijden worden
// gebruikt, bij géén enkele.
//
// Daarom telt dit scherm wél alles op wat er is, maar toont het geen nullen
// als er niets is. Een dagtotaal van "0 mg ijzer" leest als een tekort,
// terwijl het betekent dat we het niet weten. Dat verschil hoort zichtbaar te
// zijn. Zodra de gegevens gevuld worden, gaat dit blok vanzelf werken.

import React, { useState, useEffect } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'

// Nette namen en eenheden voor de sleutels die in vitamins_minerals voorkomen.
// Wat hier niet in staat wordt getoond onder zijn ruwe sleutel — beter een
// lelijke naam dan een stilzwijgend weggelaten voedingsstof.
const MICRO_META = {
  calcium_mg:     { naam: 'Calcium',     eenheid: 'mg' },
  iron_mg:        { naam: 'IJzer',       eenheid: 'mg' },
  magnesium_mg:   { naam: 'Magnesium',   eenheid: 'mg' },
  potassium_mg:   { naam: 'Kalium',      eenheid: 'mg' },
  phosphorus_mg:  { naam: 'Fosfor',      eenheid: 'mg' },
  zinc_mg:        { naam: 'Zink',        eenheid: 'mg' },
  vitamin_a_ug:   { naam: 'Vitamine A',  eenheid: 'µg' },
  vitamin_b1_mg:  { naam: 'Vitamine B1', eenheid: 'mg' },
  vitamin_b2_mg:  { naam: 'Vitamine B2', eenheid: 'mg' },
  vitamin_b6_mg:  { naam: 'Vitamine B6', eenheid: 'mg' },
  vitamin_b9_ug:  { naam: 'Foliumzuur',  eenheid: 'µg' },
  vitamin_b12_ug: { naam: 'Vitamine B12', eenheid: 'µg' },
  vitamin_c_mg:   { naam: 'Vitamine C',  eenheid: 'mg' },
  vitamin_d_ug:   { naam: 'Vitamine D',  eenheid: 'µg' },
  vitamin_e_mg:   { naam: 'Vitamine E',  eenheid: 'mg' },
}

const netjes = (n) => n >= 100 ? Math.round(n) : Math.round(n * 10) / 10

export default function VezelsMicros({ db, maaltijden = [], isMobile }) {
  const m = isMobile
  const [open, setOpen] = useState(false)
  const [ingredienten, setIngredienten] = useState(null)  // null = nog niet geladen
  const [laden, setLaden] = useState(false)

  // Vezels komen van de maaltijd zelf — die staan al in het slot, dus daar is
  // geen extra query voor nodig.
  const vezels = maaltijden.reduce((t, mm) => t + (Number(mm?.fiber) || 0), 0)

  // Welke ingrediënten en hoeveel gram, over alle maaltijden van de dag heen.
  const porties = (() => {
    const per = new Map()
    maaltijden.forEach(mm => {
      const lijst = Array.isArray(mm?.ingredients_list) ? mm.ingredients_list : []
      lijst.forEach(r => {
        const id = r?.ingredient_id
        if (!id) return
        per.set(id, (per.get(id) || 0) + (Number(r.amount) || 0))
      })
    })
    return per
  })()

  const ids = [...porties.keys()]
  const idsSleutel = ids.slice().sort().join(',')

  // Pas ophalen als je openklapt. Dit blok is bijzaak; de dagweergave hoeft er
  // niet trager van te worden voor iedereen die het nooit opent.
  useEffect(() => {
    if (!open || !db?.supabase || ids.length === 0) return
    let leeft = true
    setLaden(true)
    db.supabase
      .from('ai_ingredients')
      .select('id, name, sodium_per_100g, vitamins_minerals')
      .in('id', ids)
      .then(({ data }) => { if (leeft) setIngredienten(data || []) },
            (e) => { console.warn('micro-gegevens laden mislukt:', e); if (leeft) setIngredienten([]) })
      .then(() => { if (leeft) setLaden(false) })
    return () => { leeft = false }
    // idsSleutel en niet ids: een nieuwe array met dezelfde inhoud zou de
    // query bij elke render opnieuw afvuren.
  }, [open, db, idsSleutel])

  const { natrium, micros } = (() => {
    const uit = { natrium: 0, micros: {} }
    if (!ingredienten) return uit
    ingredienten.forEach(ing => {
      const gram = porties.get(ing.id) || 0
      const f = gram / 100
      uit.natrium += (Number(ing.sodium_per_100g) || 0) * f
      const vm = ing.vitamins_minerals
      if (vm && typeof vm === 'object') {
        Object.entries(vm).forEach(([k, v]) => {
          const waarde = Number(v)
          if (!Number.isFinite(waarde)) return
          uit.micros[k] = (uit.micros[k] || 0) + waarde * f
        })
      }
    })
    return uit
  })()

  const microRijen = Object.entries(micros)
    .filter(([, v]) => v > 0)
    .sort((a, b) => (MICRO_META[a[0]]?.naam || a[0]).localeCompare(MICRO_META[b[0]]?.naam || b[0]))

  const regel = (label, waarde, eenheid) => (
    <div key={label} style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10,
      padding: '0.3rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)',
    }}>
      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>{label}</span>
      <span style={{ fontSize: '0.8rem', fontWeight: 900, color: '#fff', whiteSpace: 'nowrap' }}>
        {netjes(waarde)}<span style={{ fontSize: '0.62rem', fontWeight: 700, color: 'rgba(255,255,255,0.35)' }}> {eenheid}</span>
      </span>
    </div>
  )

  return (
    <div style={{ margin: m ? '0 0.5rem 0.5rem' : '0 0.75rem 0.6rem' }}>
      <button onClick={() => setOpen(o => !o)} style={{
        display: 'flex', alignItems: 'center', gap: 6, width: '100%',
        padding: '0.5rem 0.65rem',
        background: 'rgba(255,255,255,0.03)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        borderLeft: '1px solid rgba(255,255,255,0.08)',
        borderRight: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit',
        color: '#fff', fontSize: '0.74rem', fontWeight: 900,
        touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
      }}>
        {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        Vezels &amp; micro&apos;s
        <span style={{ marginLeft: 'auto', fontSize: '0.72rem', fontWeight: 800, color: 'rgba(255,255,255,0.45)' }}>
          {netjes(vezels)}g vezels
        </span>
      </button>

      {open && (
        <div style={{
          padding: '0.5rem 0.65rem 0.6rem',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          borderLeft: '1px solid rgba(255,255,255,0.08)',
          borderRight: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(255,255,255,0.015)',
        }}>
          {regel('Vezels', vezels, 'g')}
          {/* Natrium alleen als het ergens op slaat. De kolom is bij 24.000
              van de 37.545 ingrediënten gevuld, maar de seed-ingrediënten
              staan op nul — en "0 mg natrium" leest als een feit terwijl het
              een gat is. */}
          {ingredienten && natrium > 0 && regel('Natrium', natrium, 'mg')}

          {laden && (
            <div style={{ padding: '0.5rem 0', fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)' }}>
              Laden…
            </div>
          )}

          {!laden && ingredienten && microRijen.length > 0 && (
            <div style={{ marginTop: '0.5rem' }}>
              <div style={{ fontSize: '0.6rem', fontWeight: 800, color: 'rgba(255,255,255,0.35)', marginBottom: 2 }}>
                Vitaminen &amp; mineralen
              </div>
              {microRijen.map(([sleutel, waarde]) =>
                regel(MICRO_META[sleutel]?.naam || sleutel, waarde, MICRO_META[sleutel]?.eenheid || ''))}
            </div>
          )}

          {/* Geen nullen tonen als we het simpelweg niet weten. "0 mg ijzer"
              leest als een tekort; dit leest als een gat in de gegevens. */}
          {!laden && ingredienten && microRijen.length === 0 && (
            <div style={{ marginTop: '0.5rem', fontSize: '0.65rem', fontWeight: 700, color: 'rgba(255,255,255,0.35)', lineHeight: 1.4 }}>
              Van de {ingredienten.length} ingrediënten in deze dag zijn geen
              vitaminen en mineralen vastgelegd{natrium > 0 ? '' : ', en ook geen natrium'}.
              Zodra die gegevens er zijn, verschijnen ze hier vanzelf.
            </div>
          )}

          {ids.length === 0 && (
            <div style={{ marginTop: '0.5rem', fontSize: '0.65rem', fontWeight: 700, color: 'rgba(255,255,255,0.35)' }}>
              Deze maaltijden hebben geen ingrediëntenlijst, dus alleen de vezels zijn bekend.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
