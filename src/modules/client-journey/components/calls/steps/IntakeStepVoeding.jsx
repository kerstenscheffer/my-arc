// src/modules/client-journey/components/calls/steps/IntakeStepVoeding.jsx
// v2 — Flow met pills + intake context + direct DB save
import React, { useState, useEffect } from 'react'
import { ChevronRight, Check, Utensils, Clock, Heart, AlertTriangle, Zap, RefreshCw, Coffee, Scale } from 'lucide-react'

const C = {
  gold: '#FFD700', green: '#10b981', blue: '#3b82f6', amber: '#f59e0b', red: '#ef4444',
  text: '#ffffff', text50: 'rgba(255,255,255,0.5)', text25: 'rgba(255,255,255,0.25)',
  border: 'rgba(255,255,255,0.08)', borderSub: 'rgba(255,255,255,0.04)',
}

const ONTBIJT_SUBS = {
  brood_kaas:'Brood+kaas', brood_vlees:'Brood+vlees', brood_pindakaas:'Pindakaas',
  havermout_fruit:'Havermout+fruit', havermout_noten:'Havermout+noten',
  kwark_fruit:'Kwark+fruit', griekse_yoghurt:'Griekse yoghurt', skyr:'Skyr',
  gebakken:'Gebakken ei', eieren_scrambled:'Scrambled eggs', omelet:'Omelet',
  smoothie:'Smoothie', fruit_yoghurt:'Fruit+yoghurt', muesli:'Muesli',
}
const LUNCH_SUBS = {
  brood_kaas:'Brood+kaas', brood_vlees:'Brood+vlees', lunch_wrap_kip:'Wrap kip',
  lunch_tosti:'Tosti', salade_kip:'Salade kip', salade_tonijn:'Salade tonijn',
  lunch_rijst:'Rijst', lunch_pasta:'Pasta', lunch_wok:'Wok',
}
const DINER_SUBS = {
  rijst_kip:'Rijst+kip', rijst_rund:'Rijst+rund', rijst_zalm:'Rijst+zalm',
  bolognese:'Bolognese', pasta_kip:'Pasta+kip', bami:'Bami goreng',
  aard_kip:'Aardappel+kip', aard_vlees:'Aardappel+vlees', stamppot:'Stamppot',
}

const mapSubs = (subs, map) => (subs || []).map(s => map[s] || s).filter(Boolean).join(', ')

const QUESTIONS = [
  {
    id: 'verandering',
    question: 'Wat moet er veranderen in je voeding?',
    suggestions: [
      { icon: Scale,     text: 'Meer eiwitten per dag' },
      { icon: Utensils,  text: 'Maaltijden plannen en preppen' },
      { icon: Zap,       text: 'Meer eten overall — surplus opbouwen' },
      { icon: RefreshCw, text: 'Minder eten overall — in tekort gaan' },
      { icon: Coffee,    text: 'Minder snacks en suiker' },
      { icon: Clock,     text: 'Regelmatiger eten door de dag' },
      { icon: Heart,     text: 'Voeding loopt al goed' },
    ],
  },
  {
    id: 'aanpak',
    question: 'Hoe streng gaan we het plan volgen?',
    type: 'coaching_level',
  },
  {
    id: 'mealprep',
    question: 'Meal prep en variatie — hoe wil je dit aanpakken?',
    suggestions: [
      { icon: RefreshCw, text: 'Vaste maaltijden — zelfde dingen elke week' },
      { icon: Utensils,  text: 'Meal prep — zondag alles klaarzetten' },
      { icon: Heart,     text: 'Veel variatie — elke dag iets anders' },
      { icon: Clock,     text: 'Mix — basis hetzelfde, avondeten wisselend' },
      { icon: Zap,       text: 'Zo simpel mogelijk — weinig kookwerk' },
    ],
  },
  {
    id: 'dagvoorbeeld',
    question: 'Zou je blij zijn met een dag als dit?',
    type: 'dagvoorbeeld',
  },
  {
    id: 'restricties',
    question: 'Restricties of afwijkingen bespreken?',
    type: 'restricties',
  },
]

const LEVELS = [
  { id: 'A', label: 'Strict plan',      desc: 'Exact volgen, alles loggen, wijzigingen doorgeven', color: C.gold },
  { id: 'B', label: 'Flexibel plan',    desc: 'Mealplan als richtlijn, macro targets halen',       color: C.blue },
  { id: 'C', label: 'Macro coaching',   desc: 'Eigen eetpatroon, jij stuurt bij op macro\'s',      color: C.green },
]

// Bouw een voorbeelddag op basis van intake wensen + macro targets
function buildExampleDay(cd, np, numMeals, ontbijt, lunch, diner) {
  const prot = cd?.target_protein || 160
  const cal = cd?.target_calories || 2500
  const isCut = ['fat_loss', 'recomp', 'general_fitness'].includes(cd?.primary_goal)

  // Ontbijt voorbeeld
  const ontbijtEx = ontbijt
    ? `${ontbijt.split(',')[0].trim()} (${Math.round(prot * 0.25)}g E)`
    : `Kwark met havermout en fruit (${Math.round(prot * 0.25)}g E)`

  // Lunch voorbeeld
  const lunchEx = lunch
    ? `${lunch.split(',')[0].trim()} (${Math.round(prot * 0.25)}g E)`
    : isCut
      ? `Kipfilet salade met rijst (${Math.round(prot * 0.25)}g E)`
      : `Brood met kipfilet en groenten (${Math.round(prot * 0.25)}g E)`

  // Diner voorbeeld
  const dinerEx = diner
    ? `${diner.split(',')[0].trim()} (${Math.round(prot * 0.30)}g E)`
    : `Kipfilet met rijst en groenten (${Math.round(prot * 0.30)}g E)`

  const base = [
    { label: 'Ontbijt', example: ontbijtEx },
    { label: 'Lunch', example: lunchEx },
    { label: 'Diner', example: dinerEx },
  ]

  // Snacks toevoegen op basis van aantal maaltijden
  if (numMeals >= 4) base.splice(2, 0, { label: 'Snack 1', example: `Griekse yoghurt met noten (${Math.round(prot * 0.15)}g E)` })
  if (numMeals >= 5) base.push({ label: 'Snack 2', example: `Kwark of proteïneshake (${Math.round(prot * 0.10)}g E)` })
  if (numMeals >= 6) base.push({ label: 'Snack 3', example: `Cottage cheese of rijstwafels (${Math.round(prot * 0.05)}g E)` })

  return base
}

function Pill({ icon: Icon, text, active, onToggle }) {
  return (
    <button onClick={onToggle} style={{
      display: 'flex', alignItems: 'center', gap: '10px',
      width: '100%', padding: '8px 12px', minHeight: '40px',
      background: active ? 'rgba(16,185,129,0.08)' : 'transparent',
      border: `1px solid ${active ? 'rgba(16,185,129,0.30)' : C.border}`,
      borderRadius: '8px', cursor: 'pointer', textAlign: 'left',
      touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
      transition: 'all 0.12s',
    }}>
      <div style={{
        width: '26px', height: '26px', borderRadius: '6px', flexShrink: 0,
        background: active ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${active ? 'rgba(16,185,129,0.30)' : C.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {active
          ? <Check size={13} color={C.green} strokeWidth={2.5} />
          : <Icon size={13} color="rgba(255,255,255,0.2)" strokeWidth={1.5} />
        }
      </div>
      <span style={{ fontSize: '13px', fontWeight: active ? 700 : 500, color: active ? C.green : C.text50 }}>
        {text}
      </span>
    </button>
  )
}

function Badge({ label, value, color }) {
  if (!value) return null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
      <span style={{ fontSize: '8px', fontWeight: 700, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
      <span style={{ fontSize: '11px', fontWeight: 700, color: color || C.text50 }}>{value}</span>
    </div>
  )
}

export default function IntakeStepVoeding({ cd, np, db, notes, updateNotes, coachingLevel, setCoachingLevel, onComplete, onBack, isMobile }) {
  const [qIndex, setQIndex] = useState(0)
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')

  const n = notes.voeding || {}
  const update = (key, val) => updateNotes('voeding', { [key]: val })

  const currentQ = QUESTIONS[qIndex]
  const isLast = qIndex === QUESTIONS.length - 1

  // Voeding data uit intake
  const wishes = np?.wishes || {}
  const ontbijt = wishes.ontbijt_subs?.length ? mapSubs(wishes.ontbijt_subs, ONTBIJT_SUBS) : wishes.ontbijt_categories?.join(', ') || null
  const lunch = wishes.lunch_subs?.length ? mapSubs(wishes.lunch_subs, LUNCH_SUBS) : wishes.lunch_categories?.join(', ') || null
  const diner = wishes.diner_subs?.length ? mapSubs(wishes.diner_subs, DINER_SUBS) : wishes.diner_categories?.join(', ') || null
  const nietLekker = (wishes.niet_lekker || []).join(', ') || null
  const dietPref = np?.allergens?.diet_preference
  const allergens = [...(np?.allergens?.selected_allergens || []), ...(np?.allergens?.intolerances || [])].filter(Boolean)
  const hasRestrictions = allergens.length > 0 || (dietPref && dietPref !== 'geen') || nietLekker

  // Save coaching level naar DB
  const saveCoachingLevel = async (level) => {
    setCoachingLevel(level)
    update('coaching_level', level)
    if (!db?.supabase || !cd?.id) return
    setSaving(true)
    const { error } = await db.supabase.from('clients').update({ coaching_style_pref: level }).eq('id', cd.id)
    if (error) console.error('❌ Coaching level save:', error.message)
    else { setSavedMsg('Opgeslagen'); setTimeout(() => setSavedMsg(''), 2000) }
    setSaving(false)
  }

  // Pills toggle
  const getSelected = (id) => {
    const q = QUESTIONS.find(q => q.id === id)
    if (!q || !q.suggestions) return []
    const texts = q.suggestions.map(s => s.text)
    return (n[id] || '').split(' · ').filter(t => texts.includes(t))
  }

  const togglePill = (id, text) => {
    const cur = getSelected(id)
    const next = cur.includes(text) ? cur.filter(p => p !== text) : [...cur, text]
    update(id, next.join(' · '))
  }

  const renderQuestion = () => {
    // Coaching level keuze
    if (currentQ.type === 'coaching_level') {
      return (
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {LEVELS.map(lv => {
            const active = (coachingLevel || n.coaching_level) === lv.id
            return (
              <button key={lv.id} onClick={() => saveCoachingLevel(lv.id)} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '12px 14px', borderRadius: '8px',
                background: active ? `${lv.color}08` : 'transparent',
                border: `1px solid ${active ? `${lv.color}35` : C.border}`,
                cursor: 'pointer', textAlign: 'left', width: '100%',
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                transition: 'all 0.12s',
              }}>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '7px', flexShrink: 0,
                  background: active ? `${lv.color}15` : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${active ? `${lv.color}35` : C.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '11px', fontWeight: 800,
                  color: active ? lv.color : C.text25,
                }}>{lv.id}</div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: active ? 800 : 600, color: active ? lv.color : C.text50 }}>
                    {lv.label}
                  </div>
                  <div style={{ fontSize: '10px', color: C.text25, marginTop: '2px' }}>{lv.desc}</div>
                </div>
              </button>
            )
          })}
        </div>
      )
    }

    // Dagvoorbeeld validatie
    if (currentQ.type === 'dagvoorbeeld') {
      // Bouw voorbeeld dag op basis van intake wensen
      const numMeals = np?.meal_schedule?.num_meals || 4
      const exampleDay = buildExampleDay(cd, np, numMeals, ontbijt, lunch, diner)
      const blij = n.dagvoorbeeld_blij

      return (
        <div style={{ padding: '0 16px' }}>
          {/* Voorbeeld dag */}
          <div style={{ marginBottom: '14px', padding: '12px 14px', background: 'rgba(255,255,255,0.02)', border: `1px solid ${C.border}`, borderRadius: '8px' }}>
            <div style={{ fontSize: '9px', fontWeight: 700, color: C.text25, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
              Voorbeelddag · {numMeals} maaltijden
            </div>
            {exampleDay.map((meal, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'baseline', gap: '8px',
                padding: '5px 0',
                borderBottom: i < exampleDay.length - 1 ? `1px solid ${C.borderSub}` : 'none',
              }}>
                <span style={{ fontSize: '9px', fontWeight: 700, color: C.text25, textTransform: 'uppercase', minWidth: '52px', flexShrink: 0 }}>{meal.label}</span>
                <span style={{ fontSize: '12px', color: C.text50, lineHeight: 1.4 }}>{meal.example}</span>
              </div>
            ))}
          </div>

          {/* Reactie */}
          <div style={{ fontSize: '12px', fontWeight: 600, color: C.text25, marginBottom: '8px' }}>
            Zou je hier blij mee zijn?
          </div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <button onClick={() => update('dagvoorbeeld_blij', 'ja')} style={{
              flex: 1, padding: '10px', borderRadius: '8px',
              background: blij === 'ja' ? 'rgba(16,185,129,0.12)' : 'transparent',
              border: `1px solid ${blij === 'ja' ? 'rgba(16,185,129,0.4)' : C.border}`,
              color: blij === 'ja' ? C.green : C.text25,
              fontSize: '13px', fontWeight: blij === 'ja' ? 800 : 600,
              cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            }}>
              ✓ Ja, dit klinkt goed
            </button>
            <button onClick={() => update('dagvoorbeeld_blij', 'nee')} style={{
              flex: 1, padding: '10px', borderRadius: '8px',
              background: blij === 'nee' ? 'rgba(239,68,68,0.08)' : 'transparent',
              border: `1px solid ${blij === 'nee' ? 'rgba(239,68,68,0.3)' : C.border}`,
              color: blij === 'nee' ? C.red : C.text25,
              fontSize: '13px', fontWeight: blij === 'nee' ? 800 : 600,
              cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            }}>
              ✗ Niet helemaal
            </button>
          </div>

          {/* Als nee: wat zou anders moeten? */}
          {blij === 'nee' && (
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: C.text25, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
                Wat zou je anders willen zien?
              </div>
              <textarea
                value={n.dagvoorbeeld_anders || ''}
                onChange={e => update('dagvoorbeeld_anders', e.target.value)}
                placeholder="Bijv: ontbijt mag groter, geen brood bij lunch, meer variatie in diner..."
                rows={3}
                autoFocus
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: '8px',
                  background: 'rgba(255,255,255,0.02)', border: `1px solid ${C.border}`,
                  color: C.text, fontSize: '13px', outline: 'none',
                  fontFamily: 'inherit', resize: 'none', lineHeight: 1.5,
                  boxSizing: 'border-box',
                }}
              />
            </div>
          )}

          {blij === 'ja' && (
            <div style={{ padding: '8px 12px', background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '8px', fontSize: '11px', color: C.green, fontWeight: 600 }}>
              Top — dit wordt de basis voor het plan.
            </div>
          )}
        </div>
      )
    }

    // Restricties overzicht
    if (currentQ.type === 'restricties') {
      return (
        <div style={{ padding: '0 16px' }}>
          {/* Eetpatroon uit intake */}
          {(ontbijt || lunch || diner) && (
            <div style={{ marginBottom: '16px', padding: '12px 14px', background: 'rgba(255,255,255,0.02)', border: `1px solid ${C.border}`, borderRadius: '8px' }}>
              <div style={{ fontSize: '9px', fontWeight: 700, color: C.text25, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Eetpatroon uit intake</div>
              {ontbijt && <MealRow label="Ontbijt" value={ontbijt} />}
              {lunch && <MealRow label="Lunch" value={lunch} />}
              {diner && <MealRow label="Diner" value={diner} />}
            </div>
          )}

          {/* Restricties */}
          {hasRestrictions ? (
            <div style={{ marginBottom: '16px', padding: '12px 14px', background: 'rgba(245,158,11,0.05)', border: `1px solid rgba(245,158,11,0.2)`, borderLeft: `3px solid ${C.amber}`, borderRadius: '0 8px 8px 0' }}>
              <div style={{ fontSize: '9px', fontWeight: 700, color: C.amber, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Restricties</div>
              {dietPref && dietPref !== 'geen' && <MealRow label="Dieet" value={dietPref} />}
              {allergens.length > 0 && <MealRow label="Allergie" value={allergens.join(', ')} color={C.red} />}
              {nietLekker && <MealRow label="Niet lekker" value={nietLekker} />}
            </div>
          ) : (
            <div style={{ marginBottom: '16px', padding: '10px 14px', background: 'rgba(16,185,129,0.05)', border: `1px solid rgba(16,185,129,0.15)`, borderRadius: '8px', fontSize: '12px', color: C.green, fontWeight: 600 }}>
              ✓ Geen restricties of allergieën
            </div>
          )}

          {/* Aanvullende notitie */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: C.text25, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
              Aanvulling / afwijkingen besproken
            </div>
            <textarea
              value={n.restricties_notitie || ''}
              onChange={e => update('restricties_notitie', e.target.value)}
              placeholder="Bijv: wil geen kip meer, heeft lactose probleem bijgekomen..."
              rows={3}
              style={{
                width: '100%', padding: '10px 12px', borderRadius: '8px',
                background: 'transparent', border: `1px solid ${C.border}`,
                color: C.text, fontSize: '13px', outline: 'none',
                fontFamily: 'inherit', resize: 'none', lineHeight: 1.5,
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>
      )
    }

    // Pills
    const suggestions = currentQ.suggestions || []
    const selected = getSelected(currentQ.id)
    return (
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {suggestions.map((s, i) => (
          <Pill key={i} icon={s.icon} text={s.text} active={selected.includes(s.text)} onToggle={() => togglePill(currentQ.id, s.text)} />
        ))}
        <div style={{ marginTop: '4px', borderTop: `1px solid ${C.borderSub}`, paddingTop: '4px' }}>
          <input
            type="text"
            value={n[`${currentQ.id}_extra`] || ''}
            onChange={e => update(`${currentQ.id}_extra`, e.target.value)}
            placeholder="Of typ zelf..."
            style={{
              width: '100%', padding: '8px 12px', borderRadius: '8px',
              background: 'transparent', border: `1px solid ${C.border}`,
              color: C.text, fontSize: '13px', outline: 'none',
              fontFamily: 'inherit', boxSizing: 'border-box',
            }}
          />
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Header */}
      <div style={{ padding: '8px 16px', borderBottom: `1px solid ${C.borderSub}`, display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        <span style={{ fontSize: '9px', fontWeight: 700, color: C.text25, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Stap 3 · Voeding</span>
        <div style={{ flex: 1, height: '2px', background: 'rgba(255,255,255,0.06)', borderRadius: '1px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${((qIndex + 1) / QUESTIONS.length) * 100}%`, background: C.green, transition: 'width 0.3s' }} />
        </div>
        {saving && <span style={{ fontSize: '9px', color: C.text25 }}>Opslaan...</span>}
        {savedMsg && <span style={{ fontSize: '9px', color: C.green, fontWeight: 700 }}>✓ {savedMsg}</span>}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <div style={{ maxWidth: '560px', margin: '0 auto' }}>

          {/* Intake context */}
          <div style={{ display: 'flex', gap: '16px', padding: '10px 16px', borderBottom: `1px solid ${C.borderSub}`, flexWrap: 'wrap' }}>
            <Badge label="Maaltijden" value={np?.meal_schedule?.num_meals ? `${np.meal_schedule.num_meals}x/dag` : null} />
            <Badge label="Kooktijd" value={cd?.cooking_time ? `${cd.cooking_time} min` : null} />
            <Badge label="Budget" value={np?.life_context?.weekly_budget ? `€${np.life_context.weekly_budget}/week` : null} />
            <Badge label="Koken" value={{ graag: 'Kookt graag', neutraal: 'Maakt niet uit', niet_graag: 'Zo min mogelijk' }[np?.life_context?.cooking_preference]} />
            <Badge label="Cheat" value={{ nooit: 'Geen', '1x_week': '1x/week', weekend: 'Weekend', als_nodig: 'Als nodig' }[np?.cheat_meals?.frequency]} />
            <Badge label="Supplementen" value={{ ja_graag: 'Wil supps', basics: 'Basics', liever_niet: 'Liever niet', nee: 'Geen' }[np?.supplement_preferences?.openness]} />
          </div>

          {/* Dots */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '5px', padding: '16px 0 12px' }}>
            {QUESTIONS.map((_, i) => (
              <div key={i} style={{
                width: i === qIndex ? '22px' : '6px', height: '3px', borderRadius: '2px',
                background: i <= qIndex ? C.green : 'rgba(255,255,255,0.12)',
                transition: 'all 0.25s',
              }} />
            ))}
          </div>

          {/* Vraag */}
          <div style={{ textAlign: 'center', padding: '0 16px 16px' }}>
            <div style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: 800, color: C.text, lineHeight: 1.25, letterSpacing: '-0.02em' }}>
              {currentQ.question}
            </div>
          </div>

          {renderQuestion()}

          {/* Nav — direct onder content */}
          <div style={{ padding: '10px 16px 20px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={qIndex > 0 ? () => setQIndex(qIndex - 1) : onBack} style={{
                width: '44px', height: '44px', background: 'transparent',
                border: `1px solid ${C.border}`, borderRadius: '8px',
                color: C.text25, cursor: 'pointer', fontSize: '16px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', flexShrink: 0,
              }}>←</button>
              <button onClick={isLast ? onComplete : () => setQIndex(qIndex + 1)} style={{
                flex: 1, height: '44px',
                background: isLast ? 'rgba(16,185,129,0.08)' : 'rgba(16,185,129,0.06)',
                border: `1px solid ${isLast ? 'rgba(16,185,129,0.3)' : 'rgba(16,185,129,0.2)'}`,
                borderRadius: '8px', color: C.green,
                fontSize: '12px', fontWeight: 800,
                cursor: 'pointer', letterSpacing: '0.06em', textTransform: 'uppercase',
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              }}>
                {isLast ? 'Naar plan' : 'Volgende'} <ChevronRight size={13} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function MealRow({ label, value, color }) {
  return (
    <div style={{ display: 'flex', gap: '8px', padding: '3px 0', borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
      <span style={{ fontSize: '9px', fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.05em', minWidth: '52px', paddingTop: '1px' }}>{label}</span>
      <span style={{ fontSize: '11px', color: color || C.text50, lineHeight: 1.4 }}>{value}</span>
    </div>
  )
}
