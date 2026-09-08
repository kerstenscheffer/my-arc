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
import { X, ChefHat, Check, Loader, Package, Snowflake, Lightbulb } from 'lucide-react'
import { toHumanAmount } from '../../ai-meal-generator/utils/unitConverter'
import { foodImageFallback } from '../foodImageFallback'

const GROEN = '#10b981'
const GOUD = '#FFD700'

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

  const kop = (icoon, tekst) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.6rem' }}>
      {icoon}
      <span style={{ fontSize: '0.6rem', fontWeight: 800, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{tekst}</span>
    </div>
  )

  const vak = { padding: isMobile ? '0.9rem 1rem' : '1.1rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(12px)', display: 'flex', flexDirection: 'column', zIndex: 10600 }}>
      <div onClick={e => e.stopPropagation()} style={{ flex: 1, display: 'flex', flexDirection: 'column', maxWidth: isMobile ? '100%' : 600, width: '100%', margin: '0 auto', background: '#0a0a0a', overflow: 'hidden' }}>

        {/* Kop */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.6rem', padding: isMobile ? '0.8rem 1rem' : '0.9rem 1.5rem', borderBottom: `1px solid rgba(16,185,129,0.25)`, flexShrink: 0 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: GROEN, fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              <ChefHat size={13} /> Meal preppen
            </div>
            <div style={{ fontSize: isMobile ? '1rem' : '1.1rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {naam}
            </div>
          </div>
          <button onClick={onClose} style={{ width: 36, height: 36, flexShrink: 0, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}><X size={18} /></button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>

          {/* Hoeveel dagen */}
          <div style={vak}>
            {kop(<Package size={12} color="rgba(255,255,255,0.35)" />, 'Voor hoeveel dagen?')}
            <div style={{ display: 'flex', gap: '0.3rem' }}>
              {[1, 2, 3, 4, 5, 6, 7].map(n => {
                const aan = n === dagen
                return (
                  <button key={n} onClick={() => setDagen(n)} style={{
                    flex: 1, padding: isMobile ? '0.65rem 0' : '0.7rem 0',
                    background: aan ? 'rgba(16,185,129,0.16)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${aan ? GROEN : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: 9, color: aan ? GROEN : 'rgba(255,255,255,0.55)',
                    fontSize: isMobile ? '0.9rem' : '0.95rem', fontWeight: 800,
                    cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                    minHeight: 42, fontFamily: 'inherit',
                  }}>{n}</button>
                )
              })}
            </div>
            {teLang && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem', marginTop: '0.6rem', padding: '0.5rem 0.6rem', background: 'rgba(255,215,0,0.06)', border: '1px solid rgba(255,215,0,0.2)', borderRadius: 8 }}>
                <Snowflake size={13} color={GOUD} style={{ flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: '0.68rem', fontWeight: 600, color: 'rgba(255,215,0,0.85)', lineHeight: 1.4 }}>
                  {houdbaar} dagen in de koelkast met deze ingrediënten. Vries de bakjes vanaf dag {houdbaar + 1} in.
                </span>
              </div>
            )}
          </div>

          {/* Boodschappen */}
          <div style={vak}>
            {kop(<Package size={12} color="rgba(255,255,255,0.35)" />, `Wat je nodig hebt · ${dagen} portie${dagen !== 1 ? 's' : ''}`)}
            {ingredients.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {ingredients.map((ing, i) => {
                  const totaal = (Number(ing.amount) || 0) * dagen
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.5rem 0', borderBottom: i < ingredients.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}>
                      <div style={{ width: 38, height: 38, borderRadius: 9, flexShrink: 0, overflow: 'hidden', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img src={ing.image_url || foodImageFallback(ing.name, null, 120)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.currentTarget.style.display = 'none' }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'rgba(255,255,255,0.85)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ing.name}</div>
                        <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.25)', marginTop: 1 }}>
                          {toHumanAmount(ing.name, Number(ing.amount) || 0)} per bakje
                        </div>
                      </div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 800, color: GROEN, flexShrink: 0 }}>
                        {toHumanAmount(ing.name, totaal)}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.25)', padding: '0.4rem 0' }}>
                Voor deze maaltijd staan geen ingrediënten in het plan — het stappenplan hieronder werkt wel.
              </div>
            )}
          </div>

          {/* Macro's per bakje */}
          <div style={vak}>
            {kop(<Check size={12} color="rgba(255,255,255,0.35)" />, 'Per bakje')}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {[
                { val: perBakje.calories, label: 'kcal' },
                { val: perBakje.protein, label: 'eiwit' },
                { val: perBakje.carbs, label: 'koolh' },
                { val: perBakje.fat, label: 'vet' },
              ].map(x => (
                <div key={x.label} style={{ flex: 1, padding: '0.55rem 0', textAlign: 'center', background: 'rgba(255,255,255,0.03)', borderRadius: 9 }}>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fff' }}>{x.val}</div>
                  <div style={{ fontSize: '0.5rem', fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 1 }}>{x.label}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: '0.65rem', fontWeight: 600, color: 'rgba(255,255,255,0.3)', marginTop: '0.5rem' }}>
              Totaal over {dagen} bakje{dagen !== 1 ? 's' : ''}: {perBakje.calories * dagen} kcal · {perBakje.protein * dagen}g eiwit
            </div>
          </div>

          {/* Stappenplan */}
          <div style={vak}>
            {kop(<ChefHat size={12} color="rgba(255,255,255,0.35)" />, 'Stappenplan')}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[...stappen, ...prepStappen].map((stap, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
                  <div style={{
                    width: 20, height: 20, flexShrink: 0, borderRadius: 6,
                    background: i < stappen.length ? 'rgba(255,255,255,0.06)' : 'rgba(16,185,129,0.14)',
                    color: i < stappen.length ? 'rgba(255,255,255,0.45)' : GROEN,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.62rem', fontWeight: 800, marginTop: 1,
                  }}>{i + 1}</div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 500, color: 'rgba(255,255,255,0.75)', lineHeight: 1.45 }}>{stap}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Tips */}
          <div style={vak}>
            {kop(<Lightbulb size={12} color="rgba(255,255,255,0.35)" />, 'Zo blijft het goed')}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              {meal?.tips && (
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,215,0,0.8)', lineHeight: 1.45, paddingBottom: '0.25rem' }}>
                  {meal.tips}
                </div>
              )}
              {tips.map((t, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                  <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.78rem', lineHeight: 1.45 }}>·</span>
                  <span style={{ fontSize: '0.78rem', fontWeight: 500, color: 'rgba(255,255,255,0.6)', lineHeight: 1.45 }}>{t}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ height: '1rem' }} />
        </div>

        {/* Opslaan */}
        <div style={{ padding: isMobile ? '0.75rem 1rem' : '0.9rem 1.5rem', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0, background: '#0a0a0a' }}>
          {fout && <div style={{ fontSize: '0.68rem', color: '#ef4444', marginBottom: '0.4rem' }}>{fout}</div>}
          <button onClick={opslaan} disabled={bewaren} style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
            padding: isMobile ? '0.8rem' : '0.9rem',
            background: bewaard ? 'rgba(16,185,129,0.18)' : GROEN,
            border: `1px solid ${bewaard ? GROEN : 'transparent'}`,
            borderRadius: 10, color: bewaard ? GROEN : '#04140e',
            fontSize: isMobile ? '0.85rem' : '0.9rem', fontWeight: 800,
            cursor: bewaren ? 'default' : 'pointer', minHeight: 48,
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', fontFamily: 'inherit',
          }}>
            {bewaren ? <Loader size={15} style={{ animation: 'prepSpin 1s linear infinite' }} /> : (bewaard ? <Check size={15} /> : <Package size={15} />)}
            {bewaard ? 'Staat in Mijn maaltijden ✓' : (bewaren ? 'Bewaren…' : 'Bewaar bakje in Mijn maaltijden')}
          </button>
          <div style={{ fontSize: '0.62rem', fontWeight: 600, color: 'rgba(255,255,255,0.28)', textAlign: 'center', marginTop: '0.4rem', lineHeight: 1.35 }}>
            Eén bakje, met macro's en stappen. Log je later in twee tikken via Mijn maaltijden.
          </div>
        </div>
      </div>
      <style>{`@keyframes prepSpin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
