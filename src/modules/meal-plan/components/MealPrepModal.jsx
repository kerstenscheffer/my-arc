// src/modules/meal-plan/components/MealPrepModal.jsx
//
// Meal preppen vanuit één maaltijd uit het plan.
//
// Je kiest voor hoeveel dagen je kookt, en de hoeveelheden schalen mee. Daaronder
// een stappenplan dat verder gaat waar het recept ophoudt — verdelen, afkoelen,
// bewaren — en de bakjes zijn met één knop terug te vinden in Mijn maaltijden,
// zodat loggen later niet opnieuw uitrekenen is.
//
// De losse MealPrepCalculator doet iets anders: die begint bij nul en laat je
// zelf ingrediënten opzoeken, voor een prep die niet uit het plan komt. Deze
// begint bij een maaltijd die er al staat.

import React, { useState } from 'react'
import { X, Check, Loader, Snowflake } from 'lucide-react'
import { toHumanAmount } from '../../ai-meal-generator/utils/unitConverter'
import { foodImageFallback } from '../foodImageFallback'


// Bewaaradvies hangt aan wat er in de bak zit, niet aan een vast getal. Vis en
// rijst zijn de twee die mensen te lang laten staan; die krijgen een kortere
// termijn dan de rest.
const KORT_HOUDBAAR = ['vis', 'zalm', 'tonijn', 'garnaal', 'kabeljauw', 'schol', 'makreel', 'haring']
const bewaarDagen = (ingredienten) => {
  const namen = (ingredienten || []).map(i => (i.name || '').toLowerCase()).join(' ')
  return KORT_HOUDBAAR.some(w => namen.includes(w)) ? 2 : 3
}

export default function MealPrepModal({ meal, ingredients = [], client, db, onClose, onSaved }) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768
  const [dagen, setDagen] = useState(3)
  const [bewaren, setBewaren] = useState(false)
  const [bewaard, setBewaard] = useState(false)
  const [fout, setFout] = useState('')

  const naam = meal?.name || meal?.meal_name || 'Maaltijd'
  const houdbaar = bewaarDagen(ingredients)
  const teLang = dagen > houdbaar

  const perBakje = {
    calories: Math.round(meal?.calories || 0),
    protein: Math.round(meal?.protein || 0),
    carbs: Math.round(meal?.carbs || 0),
    fat: Math.round(meal?.fat || 0),
  }

  const stappen = Array.isArray(meal?.preparation_steps) ? meal.preparation_steps.filter(Boolean) : []
  // Het recept beschrijft één portie. Deze stappen horen bij het preppen zelf
  // en gelden ongeacht welk recept je koos.
  const prepStappen = [
    `Weeg alles af voor ${dagen} porties — de lijst hierboven is het totaal.`,
    'Kook of bak alles in één keer; gebruik de grootste pan die je hebt.',
    `Verdeel gelijk over ${dagen} bakje${dagen !== 1 ? 's' : ''}. Weeg het eindgewicht en deel door ${dagen} als je het precies wilt hebben.`,
    'Laat open afkoelen tot kamertemperatuur voor je de deksel erop doet, anders gaat het zweten.',
    `Koelkast: ${houdbaar} dagen. Wat daarna komt gaat de vriezer in.`,
  ]

  const tips = [
    'Zet de datum op de bakjes. Zonder datum gok je later en gooi je te vroeg of te laat weg.',
    'Kook zetmeel (rijst, pasta, aardappel) net iets korter dan normaal — het gaart door in de magnetron.',
    'Doe sauzen en dressings apart in een klein potje, anders wordt de rest slap.',
    'Verse groente en kruiden voeg je toe op de dag zelf; die overleven het bewaren niet.',
  ]

  const opslaan = async () => {
    if (!db?.supabase || !client?.id) { setFout('Niet ingelogd'); return }
    setBewaren(true); setFout('')
    try {
      // Eén bakje opslaan, niet de hele prep. Dat is de eenheid die je later
      // logt; het aantal dagen staat in serving_size voor de terugblik.
      const { error } = await db.supabase.from('ai_custom_meals').insert({
        client_id: client.id,
        name: `Prep: ${naam}`,
        calories: perBakje.calories,
        protein: perBakje.protein,
        carbs: perBakje.carbs,
        fat: perBakje.fat,
        ingredients_list: meal?.ingredients_list || [],
        preparation_steps: [...stappen, ...prepStappen],
        serving_size: dagen,
        tips: `Meal prep voor ${dagen} dagen. Koelkast ${houdbaar} dagen, daarna invriezen.`,
        image_url: meal?.image_url || null,
        // Moment van de maaltijd waar je de prep van maakt (sectie-waarden
        // die ook oude app-versies kennen); zonder slot geen sectie.
        section: (() => {
          const v = String(meal?.slot || '').toLowerCase()
          if (v.includes('breakfast')) return 'ontbijt'
          if (v.includes('lunch')) return 'lunch'
          if (v.includes('dinner')) return 'diner'
          if (v.includes('pre')) return 'pre_workout'
          if (v.includes('snack') || v.includes('post')) return 'snack'
          return null
        })(),
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      if (error) throw error
      setBewaard(true)
      onSaved?.()
      setTimeout(() => setBewaard(false), 3000)
    } catch (e) {
      console.error('Prep opslaan mislukt:', e)
      setFout(e.message || 'Opslaan mislukt')
    }
    setBewaren(false)
  }

  // Stijl gelijk aan loggen en wisselen (27 okt 2026): pop-up van onder,
  // geen vakken of goud/groen, macro's met een stipje, witte knop onderaan.
  const kop = (tekst) => (
    <div style={{ fontSize: '0.62rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '1.5rem 0 0.6rem' }}>{tekst}</div>
  )
  const plusMin = {
    width: 44, height: 52, padding: 0, background: 'none', border: 'none', color: 'rgba(255,255,255,0.85)',
    fontSize: '2.2rem', fontWeight: 800, lineHeight: 1, fontFamily: 'inherit', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
  }
  const foto = meal?.image_url || foodImageFallback(naam, null, 300)

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 10600, background: 'rgba(0,0,0,0.55)',
      backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
      display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        position: 'relative', width: '100%', maxWidth: 560, margin: '0 auto', maxHeight: '94vh',
        background: '#0a0a0a', borderTop: '1px solid rgba(255,255,255,0.1)', borderTopLeftRadius: 22, borderTopRightRadius: 22,
        display: 'flex', flexDirection: 'column', overflow: 'hidden', animation: 'prepOmhoog 0.28s cubic-bezier(0.2, 0.8, 0.2, 1)',
      }}>
        <div style={{ width: 38, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.18)', margin: '8px auto 0', flexShrink: 0 }} />
        <button onClick={onClose} aria-label="Sluiten" style={{
          position: 'absolute', top: 12, right: 12, width: 36, height: 36, padding: 0, zIndex: 2,
          background: 'none', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}><X size={22} strokeWidth={2.4} /></button>

        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: isMobile ? '0.9rem 1rem 1rem' : '1rem 1.5rem 1.25rem' }}>
          {/* Kop: foto, naam */}
          <div style={{ textAlign: 'center' }}>
            <img src={foto} alt="" onError={e => { e.currentTarget.style.visibility = 'hidden' }} style={{
              width: 84, height: 84, borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.05)',
            }} />
            <div style={{ fontSize: '0.62rem', fontWeight: 800, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '0.7rem' }}>Meal prep</div>
            <div style={{ fontSize: isMobile ? '1.25rem' : '1.4rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.025em', lineHeight: 1.2, marginTop: 2, padding: '0 1.5rem' }}>{naam}</div>
          </div>

          {/* Aantal bakjes: − 3 + */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, marginTop: '1.2rem' }}>
            <button aria-label="Minder" style={{ ...plusMin, opacity: dagen <= 1 ? 0.3 : 1 }} onClick={() => setDagen(d => Math.max(1, d - 1))}>−</button>
            <div style={{ fontSize: isMobile ? '3.2rem' : '3.6rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1, minWidth: '1.4ch', textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{dagen}</div>
            <button aria-label="Meer" style={{ ...plusMin, opacity: dagen >= 7 ? 0.3 : 1 }} onClick={() => setDagen(d => Math.min(7, d + 1))}>+</button>
          </div>
          <div style={{ textAlign: 'center', fontSize: '1rem', fontWeight: 800, color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>bakje{dagen !== 1 ? 's' : ''}</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 8, fontSize: '0.72rem', fontWeight: 700, color: teLang ? '#fff' : 'rgba(255,255,255,0.4)' }}>
            <Snowflake size={13} strokeWidth={2.4} />
            {teLang ? `Koelkast ${houdbaar} dagen · vries de rest in` : `${houdbaar} dagen goed in de koelkast`}
          </div>

          {/* Per bakje: vier getallen, geen vakken */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: isMobile ? 22 : 34, marginTop: '1.4rem', paddingTop: '1.1rem', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            {[
              { label: 'kcal', waarde: perBakje.calories, kleur: '#10b981' },
              { label: 'eiwit', waarde: `${perBakje.protein}g`, kleur: '#3b82f6' },
              { label: 'koolh', waarde: `${perBakje.carbs}g`, kleur: '#ec4899' },
              { label: 'vet', waarde: `${perBakje.fat}g`, kleur: '#f59e0b' },
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
            per bakje · totaal {perBakje.calories * dagen} kcal
          </div>

          {/* Boodschappen */}
          {kop(`Wat je nodig hebt · ${dagen} bakje${dagen !== 1 ? 's' : ''}`)}
          {ingredients.length > 0 ? ingredients.map((ing, i) => {
            const totaal = (Number(ing.amount) || 0) * dagen
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <img src={ing.image_url || foodImageFallback(ing.name, null, 120)} alt="" onError={e => { e.currentTarget.style.visibility = 'hidden' }} style={{
                  width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, background: 'rgba(255,255,255,0.05)',
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ing.name}</div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginTop: 1 }}>{toHumanAmount(ing.name, Number(ing.amount) || 0)} per bakje</div>
                </div>
                <div style={{ fontSize: '0.92rem', fontWeight: 900, color: '#fff', flexShrink: 0 }}>{toHumanAmount(ing.name, totaal)}</div>
              </div>
            )
          }) : (
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>Voor deze maaltijd staan geen ingrediënten in het plan.</div>
          )}

          {/* Stappenplan */}
          {kop('Stappenplan')}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
            {[...stappen, ...prepStappen].map((stap, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <span style={{ width: 18, flexShrink: 0, fontSize: '0.85rem', fontWeight: 900, color: 'rgba(255,255,255,0.4)', lineHeight: 1.45, fontVariantNumeric: 'tabular-nums' }}>{i + 1}</span>
                <span style={{ fontSize: '0.86rem', fontWeight: 600, color: 'rgba(255,255,255,0.85)', lineHeight: 1.45 }}>{stap}</span>
              </div>
            ))}
          </div>

          {/* Tips */}
          {kop('Zo blijft het goed')}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
            {meal?.tips && <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#fff', lineHeight: 1.45 }}>{meal.tips}</div>}
            {tips.map((t, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(255,255,255,0.4)', flexShrink: 0, marginTop: 8 }} />
                <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)', lineHeight: 1.45 }}>{t}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Opslaan: vast onderaan */}
        <div style={{ flexShrink: 0, borderTop: '1px solid rgba(255,255,255,0.06)', padding: isMobile ? '0.7rem 1rem calc(1rem + env(safe-area-inset-bottom, 0px))' : '0.8rem 1.5rem 1.2rem' }}>
          {fout && <div style={{ fontSize: '0.72rem', color: '#ef4444', marginBottom: '0.45rem', textAlign: 'center' }}>{fout}</div>}
          <button onClick={opslaan} disabled={bewaren || bewaard} style={{
            width: '100%', minHeight: 50, borderRadius: 12, fontFamily: 'inherit', fontSize: '0.92rem', fontWeight: 900,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, cursor: bewaren ? 'wait' : 'pointer',
            background: bewaard ? 'transparent' : '#fff', color: bewaard ? '#fff' : '#0a0a0a',
            border: bewaard ? '1.5px solid rgba(255,255,255,0.4)' : 'none',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          }}>
            {bewaren ? <Loader size={16} style={{ animation: 'prepSpin 1s linear infinite' }} /> : <Check size={16} strokeWidth={3} />}
            {bewaard ? 'Staat in Mijn maaltijden' : (bewaren ? 'Bewaren…' : 'Bewaar bakje in Mijn maaltijden')}
          </button>
        </div>
      </div>
      <style>{'@keyframes prepSpin { to { transform: rotate(360deg); } } @keyframes prepOmhoog { from { transform: translateY(100%) } to { transform: translateY(0) } }'}</style>
    </div>
  )
}
