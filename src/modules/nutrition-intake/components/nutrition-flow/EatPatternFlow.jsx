// src/modules/nutrition-intake/components/nutrition-flow/EatPatternFlow.jsx
// Stap 1-4: Eetpatroon drill-down — 2 kolommen via flex, lijst klapt uit onder card
import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { Q, Hint, NextBtn, BigOption } from '../../../public-intake/components/phase1/FlowStep'

// Minimum aantal "dingen" dat per maaltijd ingevuld moet zijn vóór doorgaan.
// "Ding" = sub-item (specifiek gerecht), custom toegevoegd item, of een
// niet-lege tekst bij "Iets anders". Wie de maaltijd overslaat (skip_*) mag
// door zonder minimum.
const MIN_ITEMS_PER_MEAL = 3

const countMealItems = (key, data) => {
  const subs = data[`${key}_subs`] || []
  const text = data[`${key}_text`] || {}
  const textCount = Object.values(text).filter(t => (t || '').trim()).length
  return subs.length + textCount
}

const isMealSkipped = (key, data) =>
  (data[`${key}_categories`] || []).some(c => c.startsWith('skip_'))

const canContinueMeal = (key, data) =>
  isMealSkipped(key, data) || countMealItems(key, data) >= MIN_ITEMS_PER_MEAL

// Floating counter pill — portaled out of the page so it sticks above all
// scrollable content. Always visible while the user scrolls through the
// meal cards so they immediately see whether they still need to pick more.
function MealItemCounter({ count, skipped, label }) {
  const done = skipped || count >= MIN_ITEMS_PER_MEAL
  const remaining = Math.max(0, MIN_ITEMS_PER_MEAL - count)

  const bg = skipped
    ? 'rgba(75,85,99,0.95)'
    : done ? 'rgba(16,185,129,0.95)' : 'rgba(255,215,0,0.97)'
  const fg = skipped ? '#fff' : done ? '#fff' : '#000'
  const text = skipped
    ? `${label || 'Maaltijd'} overgeslagen ✓`
    : done
      ? `✓ ${count} dingen ingevuld`
      : `${count} van ${MIN_ITEMS_PER_MEAL} — kies er nog ${remaining}`

  const pill = (
    <div style={{
      position: 'fixed',
      top: 'calc(env(safe-area-inset-top) + 0.75rem)',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 2147483000,
      padding: '0.55rem 1rem', minHeight: 38,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      borderRadius: 999,
      background: bg, color: fg,
      fontSize: '0.82rem', fontWeight: 800,
      letterSpacing: '0.005em',
      boxShadow: '0 6px 22px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.06) inset',
      pointerEvents: 'none',
      maxWidth: 'calc(100vw - 2rem)',
      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      transition: 'background 0.2s ease, color 0.2s ease',
    }}>
      {text}
    </div>
  )

  if (typeof document === 'undefined') return null
  return createPortal(pill, document.body)
}

// ── Data ──────────────────────────────────────────────────────────────────────
const MAALTIJD_CONFIG = {
  ontbijt: { label: 'Ontbijt', categories: [
    { id: 'brood',         label: 'Brood of toast',      image: 'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=400&h=160&fit=crop&q=80',
      subs: [
        { id: 'brood_kaas',       label: 'Brood met kaas',      image: 'https://images.unsplash.com/photo-1528736235302-52922df5c122?w=200&h=120&fit=crop&q=80' },
        { id: 'brood_vleeswaren', label: 'Brood met vleeswaren', image: 'https://images.unsplash.com/photo-1553909489-cd47e0907980?w=200&h=120&fit=crop&q=80' },
        { id: 'brood_pindakaas',  label: 'Pindakaas',           image: 'https://images.unsplash.com/photo-1559630700-1a4e99a3f8e4?w=200&h=120&fit=crop&q=80' },
        { id: 'brood_choco',      label: 'Chocopasta',          image: 'https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=200&h=120&fit=crop&q=80' },
        { id: 'brood_ei',         label: 'Ei op brood',         image: 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=200&h=120&fit=crop&q=80' },
        { id: 'toast_avocado',    label: 'Toast avocado',       image: 'https://images.unsplash.com/photo-1541519227354-08fa5d50c820?w=200&h=120&fit=crop&q=80' },
      ]},
    { id: 'havermout',     label: 'Havermout of yoghurt', image: 'https://images.unsplash.com/photo-1515543904379-3d757afe72e4?w=400&h=160&fit=crop&q=80',
      subs: [
        { id: 'havermout_fruit', label: 'Havermout fruit',  image: 'https://images.unsplash.com/photo-1517093157656-b9eccef91cb1?w=200&h=120&fit=crop&q=80' },
        { id: 'havermout_noten', label: 'Havermout noten',  image: 'https://images.unsplash.com/photo-1495214783159-3503fd1b572d?w=200&h=120&fit=crop&q=80' },
        { id: 'kwark_fruit',     label: 'Kwark met fruit',  image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=200&h=120&fit=crop&q=80' },
        { id: 'griekse_yoghurt', label: 'Griekse yoghurt', image: 'https://images.unsplash.com/photo-1584278860047-22db9ff82bed?w=200&h=120&fit=crop&q=80' },
        { id: 'skyr',            label: 'Skyr',             image: 'https://images.unsplash.com/photo-1559598467-f8b76c8155d0?w=200&h=120&fit=crop&q=80' },
        { id: 'smoothie_bowl',   label: 'Smoothie bowl',   image: 'https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?w=200&h=120&fit=crop&q=80' },
      ]},
    { id: 'eieren',        label: 'Eieren',               image: 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=400&h=160&fit=crop&q=80',
      subs: [
        { id: 'eieren_gebakken',  label: 'Gebakken',        image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=200&h=120&fit=crop&q=80' },
        { id: 'eieren_scrambled', label: 'Scrambled eggs',  image: 'https://images.unsplash.com/photo-1551248429-40975aa4de74?w=200&h=120&fit=crop&q=80' },
        { id: 'omelet',           label: 'Omelet',          image: 'https://images.unsplash.com/photo-1510693206972-df098062cb71?w=200&h=120&fit=crop&q=80' },
        { id: 'eieren_gekookt',   label: 'Gekookt',         image: 'https://images.unsplash.com/photo-1607690424560-35d967d46cfa?w=200&h=120&fit=crop&q=80' },
        { id: 'roerei_toast',     label: 'Roerei op toast', image: 'https://images.unsplash.com/photo-1485962398705-ef6a13c41e8f?w=200&h=120&fit=crop&q=80' },
      ]},
    { id: 'fruit',         label: 'Fruit of smoothie',    image: 'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=400&h=160&fit=crop&q=80',
      subs: [
        { id: 'fruit_vers',    label: 'Vers fruit',        image: 'https://images.unsplash.com/photo-1467825487722-7e6f7060cd44?w=200&h=120&fit=crop&q=80' },
        { id: 'smoothie',      label: 'Smoothie',          image: 'https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=200&h=120&fit=crop&q=80' },
        { id: 'fruit_yoghurt', label: 'Fruit + yoghurt',  image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=200&h=120&fit=crop&q=80' },
        { id: 'muesli',        label: 'Muesli',            image: 'https://images.unsplash.com/photo-1494597564530-871f2b93ac55?w=200&h=120&fit=crop&q=80' },
      ]},
    { id: 'skip_ontbijt',  label: 'Sla ik over',          image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=160&fit=crop&q=80', subs: [] },
    { id: 'ontbijt_anders',label: 'Iets anders',           image: 'https://images.unsplash.com/photo-1493770348161-369560ae357d?w=400&h=160&fit=crop&q=80', subs: [], hasTextField: true },
  ]},
  lunch: { label: 'Lunch', categories: [
    { id: 'lunch_brood',   label: 'Brood of wrap',         image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400&h=160&fit=crop&q=80',
      subs: [
        { id: 'lunch_brood_kaas',    label: 'Brood met kaas',    image: 'https://images.unsplash.com/photo-1528736235302-52922df5c122?w=200&h=120&fit=crop&q=80' },
        { id: 'lunch_brood_vlees',   label: 'Brood met vlees',   image: 'https://images.unsplash.com/photo-1553909489-cd47e0907980?w=200&h=120&fit=crop&q=80' },
        { id: 'lunch_wrap_kip',      label: 'Wrap met kip',      image: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=200&h=120&fit=crop&q=80' },
        { id: 'lunch_wrap_groenten', label: 'Wrap groenten',     image: 'https://images.unsplash.com/photo-1592415499556-74fcb9f18667?w=200&h=120&fit=crop&q=80' },
        { id: 'lunch_tosti',         label: 'Tosti',             image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=200&h=120&fit=crop&q=80' },
        { id: 'lunch_shoarma',       label: 'Broodje shoarma',   image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=200&h=120&fit=crop&q=80' },
      ]},
    { id: 'lunch_salade',  label: 'Salade of soep',        image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=160&fit=crop&q=80',
      subs: [
        { id: 'salade_kip',    label: 'Salade met kip',    image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=200&h=120&fit=crop&q=80' },
        { id: 'salade_tonijn', label: 'Salade tonijn',     image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=200&h=120&fit=crop&q=80' },
        { id: 'salade_ei',     label: 'Salade met ei',     image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=200&h=120&fit=crop&q=80' },
        { id: 'soep',          label: 'Soep',              image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=200&h=120&fit=crop&q=80' },
        { id: 'soep_brood',    label: 'Soep + brood',      image: 'https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?w=200&h=120&fit=crop&q=80' },
      ]},
    { id: 'lunch_warm',    label: 'Warme maaltijd',        image: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=400&h=160&fit=crop&q=80',
      subs: [
        { id: 'lunch_rijst',   label: 'Rijst',   image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=200&h=120&fit=crop&q=80' },
        { id: 'lunch_pasta',   label: 'Pasta',   image: 'https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=200&h=120&fit=crop&q=80' },
        { id: 'lunch_wok',     label: 'Wok',     image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=200&h=120&fit=crop&q=80' },
        { id: 'lunch_noodles', label: 'Noodles', image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=200&h=120&fit=crop&q=80' },
      ]},
    { id: 'lunch_snacks',  label: 'Snacks',                image: 'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=400&h=160&fit=crop&q=80',
      subs: [
        { id: 'snack_noten',   label: 'Noten',         image: 'https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=200&h=120&fit=crop&q=80' },
        { id: 'snack_fruit',   label: 'Fruit',         image: 'https://images.unsplash.com/photo-1467825487722-7e6f7060cd44?w=200&h=120&fit=crop&q=80' },
        { id: 'snack_reep',    label: 'Proteïnereep',  image: 'https://images.unsplash.com/photo-1622484212973-65b7b4b10b2b?w=200&h=120&fit=crop&q=80' },
        { id: 'snack_yoghurt', label: 'Yoghurt',       image: 'https://images.unsplash.com/photo-1571212515416-fca988083f0f?w=200&h=120&fit=crop&q=80' },
        { id: 'snack_cracker', label: 'Crackers',      image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=200&h=120&fit=crop&q=80' },
      ]},
    { id: 'skip_lunch',    label: 'Sla ik over',           image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=160&fit=crop&q=80', subs: [] },
    { id: 'lunch_anders',  label: 'Iets anders',           image: 'https://images.unsplash.com/photo-1493770348161-369560ae357d?w=400&h=160&fit=crop&q=80', subs: [], hasTextField: true },
  ]},
  diner: { label: 'Avondeten', categories: [
    { id: 'diner_rijst',        label: 'Rijst',              image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&h=160&fit=crop&q=80',
      subs: [
        { id: 'rijst_kip',      label: 'Rijst met kip',   image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=200&h=120&fit=crop&q=80' },
        { id: 'rijst_rund',     label: 'Rijst met rund',  image: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=200&h=120&fit=crop&q=80' },
        { id: 'rijst_zalm',     label: 'Rijst met zalm',  image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=200&h=120&fit=crop&q=80' },
        { id: 'rijst_groenten', label: 'Rijst groenten',  image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=200&h=120&fit=crop&q=80' },
        { id: 'nasi',           label: 'Nasi goreng',     image: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=200&h=120&fit=crop&q=80' },
      ]},
    { id: 'diner_pasta',        label: 'Pasta of noodles',   image: 'https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=400&h=160&fit=crop&q=80',
      subs: [
        { id: 'pasta_bolognese', label: 'Bolognese',      image: 'https://images.unsplash.com/photo-1598866594230-a7c12756260f?w=200&h=120&fit=crop&q=80' },
        { id: 'pasta_carbonara', label: 'Carbonara',      image: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=200&h=120&fit=crop&q=80' },
        { id: 'pasta_kip',       label: 'Pasta met kip',  image: 'https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=200&h=120&fit=crop&q=80' },
        { id: 'pasta_zalm',      label: 'Pasta met zalm', image: 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=200&h=120&fit=crop&q=80' },
        { id: 'bami',            label: 'Bami goreng',    image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=200&h=120&fit=crop&q=80' },
        { id: 'noodles',         label: 'Noodles',        image: 'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=200&h=120&fit=crop&q=80' },
      ]},
    { id: 'diner_aardappelen',  label: 'Aardappelen',        image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&h=160&fit=crop&q=80',
      subs: [
        { id: 'aard_kip',   label: 'Met kip',   image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=200&h=120&fit=crop&q=80' },
        { id: 'aard_vlees', label: 'Met vlees', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=200&h=120&fit=crop&q=80' },
        { id: 'aard_vis',   label: 'Met vis',   image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=200&h=120&fit=crop&q=80' },
        { id: 'stamppot',   label: 'Stamppot',  image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=200&h=120&fit=crop&q=80' },
        { id: 'friet',      label: 'Friet',     image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=200&h=120&fit=crop&q=80' },
      ]},
    { id: 'diner_soep',         label: 'Soep of salade',     image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&h=160&fit=crop&q=80',
      subs: [
        { id: 'soep_kip',     label: 'Kippensoep',  image: 'https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?w=200&h=120&fit=crop&q=80' },
        { id: 'soep_groente', label: 'Groentesoep', image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=200&h=120&fit=crop&q=80' },
        { id: 'soep_tomaat',  label: 'Tomatensoep', image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=200&h=120&fit=crop&q=80' },
        { id: 'salade_diner', label: 'Grote salade', image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=200&h=120&fit=crop&q=80' },
      ]},
    { id: 'diner_besteld',      label: 'Besteld',            image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=160&fit=crop&q=80',
      subs: [
        { id: 'pizza',     label: 'Pizza',    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=200&h=120&fit=crop&q=80' },
        { id: 'shoarma',   label: 'Shoarma',  image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=200&h=120&fit=crop&q=80' },
        { id: 'hamburger', label: 'Hamburger',image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&h=120&fit=crop&q=80' },
        { id: 'sushi',     label: 'Sushi',    image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=200&h=120&fit=crop&q=80' },
        { id: 'chinees',   label: 'Chinees',  image: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=200&h=120&fit=crop&q=80' },
        { id: 'indiaas',   label: 'Indiaas',  image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=200&h=120&fit=crop&q=80' },
      ]},
    { id: 'diner_anders',       label: 'Iets anders',        image: 'https://images.unsplash.com/photo-1493770348161-369560ae357d?w=400&h=160&fit=crop&q=80', subs: [], hasTextField: true },
  ]},
}

const WERKTE_OPTIONS = [
  { value: 'ja',     label: 'Ja, ik weet wat werkt',  sub: 'Ik heb het eerder gedaan' },
  { value: 'beetje', label: 'Een beetje',             sub: 'Maar ben gestopt of werkte matig' },
  { value: 'nee',    label: 'Nee, ik weet het niet', sub: 'Nog nooit echt succesvol geweest' },
]

// ── Enkelvoudige categorie kolom ──────────────────────────────────────────────
// Elke kolom rendert zijn eigen cards + uitgeklapte lijsten
function KolomCards({ cats, maaltijdKey, data, onChange, isMobile }) {
  const selected   = data[`${maaltijdKey}_categories`] || []
  const selSubs    = data[`${maaltijdKey}_subs`] || []
  const textFields = data[`${maaltijdKey}_text`] || {}
  const customItems = data[`${maaltijdKey}_custom`] || {}
  const addInputs  = data[`${maaltijdKey}_addinput`] || {}

  const toggleCat = (id) => {
    const updated = selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id]
    onChange({ ...data, [`${maaltijdKey}_categories`]: updated })
  }
  const toggleSub = (id) => {
    const updated = selSubs.includes(id) ? selSubs.filter(x => x !== id) : [...selSubs, id]
    onChange({ ...data, [`${maaltijdKey}_subs`]: updated })
  }
  const toggleCustom = (catId, val) => {
    const id = `${catId}_custom_${val}`
    const updated = selSubs.includes(id) ? selSubs.filter(x => x !== id) : [...selSubs, id]
    onChange({ ...data, [`${maaltijdKey}_subs`]: updated })
  }
  const updateText = (catId, text) => {
    onChange({ ...data, [`${maaltijdKey}_text`]: { ...textFields, [catId]: text } })
  }
  const updateAddInput = (catId, text) => {
    onChange({ ...data, [`${maaltijdKey}_addinput`]: { ...addInputs, [catId]: text } })
  }
  const addCustom = (catId) => {
    const val = (addInputs[catId] || '').trim()
    if (!val) return
    const existing = customItems[catId] || []
    if (existing.includes(val)) return
    onChange({
      ...data,
      [`${maaltijdKey}_custom`]: { ...customItems, [catId]: [...existing, val] },
      [`${maaltijdKey}_addinput`]: { ...addInputs, [catId]: '' },
      [`${maaltijdKey}_subs`]: [...selSubs, `${catId}_custom_${val}`],
    })
  }
  const removeCustom = (catId, val) => {
    const updated = (customItems[catId] || []).filter(x => x !== val)
    onChange({
      ...data,
      [`${maaltijdKey}_custom`]: { ...customItems, [catId]: updated },
      [`${maaltijdKey}_subs`]: selSubs.filter(x => x !== `${catId}_custom_${val}`),
    })
  }

  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
      {cats.map(cat => {
        const isSel = selected.includes(cat.id)
        const subCount = selSubs.filter(s =>
          cat.subs.some(sub => sub.id === s) ||
          (customItems[cat.id] || []).some(v => `${cat.id}_custom_${v}` === s)
        ).length

        return (
          <div key={cat.id}>
            {/* Card */}
            <button onClick={() => toggleCat(cat.id)} style={{
              width: '100%', padding: 0, overflow: 'hidden',
              background: isSel ? 'rgba(255,215,0,0.04)' : '#0a0a0a',
              border: `1px solid ${isSel ? 'rgba(255,215,0,0.35)' : 'rgba(255,255,255,0.06)'}`,
              borderRadius: isMobile ? '8px' : '10px',
              cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              transition: 'all 0.15s ease',
            }}
              onTouchStart={e => e.currentTarget.style.transform = 'scale(0.96)'}
              onTouchEnd={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              {/* Foto — vaste hoogte */}
              <div style={{ width: '100%', height: isMobile ? '70px' : '80px', backgroundImage: `url(${cat.image})`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative', flexShrink: 0 }}>
                <div style={{ position: 'absolute', inset: 0, background: isSel ? 'linear-gradient(to top, rgba(0,0,0,0.85), rgba(0,0,0,0.15))' : 'linear-gradient(to top, rgba(0,0,0,0.9), rgba(0,0,0,0.3))' }} />
                {isSel && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, rgba(255,215,0,0.5), transparent)' }} />}
                <div style={{ position: 'absolute', bottom: '0.35rem', right: '0.35rem', width: '18px', height: '18px', borderRadius: '50%', border: `2px solid ${isSel ? '#FFD700' : 'rgba(255,255,255,0.2)'}`, background: isSel ? '#FFD700' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s ease' }}>
                  {isSel && <span style={{ fontSize: '0.48rem', fontWeight: 800, color: '#000' }}>✓</span>}
                </div>
              </div>
              {/* Label */}
              <div style={{ padding: isMobile ? '0.4rem 0.5rem' : '0.45rem 0.6rem' }}>
                <div style={{ fontSize: isMobile ? '0.78rem' : '0.82rem', fontWeight: 800, color: isSel ? '#FFD700' : '#fff', lineHeight: 1.2, letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {cat.label}
                </div>
                {isSel && cat.subs.length > 0 && (
                  <div style={{ fontSize: '0.48rem', fontWeight: 700, color: subCount > 0 ? 'rgba(255,215,0,0.5)' : 'rgba(255,255,255,0.2)', marginTop: '0.1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {subCount > 0 ? `${subCount} ↓` : 'Kies ↓'}
                  </div>
                )}
              </div>
            </button>

            {/* Subcategorieen — zelfde breedte als card */}
            {isSel && cat.subs.length > 0 && (
              <div style={{ marginTop: '0.15rem', border: '1px solid rgba(255,255,255,0.06)', borderLeft: '2px solid rgba(255,215,0,0.2)', borderRadius: '0 6px 6px 0', overflow: 'hidden' }}>
                {/* Vaste subs */}
                {cat.subs.map((sub, i) => {
                  const isSubSel = selSubs.includes(sub.id)
                  return (
                    <button key={sub.id} onClick={() => toggleSub(sub.id)} style={{
                      width: '100%', display: 'flex', alignItems: 'stretch',
                      background: isSubSel ? 'rgba(255,215,0,0.04)' : 'transparent',
                      border: 'none', borderBottom: '1px solid rgba(255,255,255,0.05)',
                      cursor: 'pointer', fontFamily: 'inherit',
                      touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                      transition: 'background 0.15s ease', minHeight: '40px',
                    }}>
                      <div style={{ width: '40px', flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${sub.image})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: isSubSel ? 0.7 : 0.35, transition: 'opacity 0.15s ease' }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0, padding: '0 0.5rem', display: 'flex', alignItems: 'center' }}>
                        <span style={{ fontSize: isMobile ? '0.72rem' : '0.75rem', fontWeight: isSubSel ? 800 : 600, color: isSubSel ? '#fff' : 'rgba(255,255,255,0.5)', letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub.label}</span>
                      </div>
                      {isSubSel && (
                        <div style={{ width: '32px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: '#FFD700', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontSize: '0.42rem', fontWeight: 800, color: '#000' }}>✓</span>
                          </div>
                        </div>
                      )}
                    </button>
                  )
                })}

                {/* Custom items */}
                {(customItems[cat.id] || []).map(val => {
                  const isSubSel = selSubs.includes(`${cat.id}_custom_${val}`)
                  return (
                    <div key={val} style={{ display: 'flex', alignItems: 'stretch', borderBottom: '1px solid rgba(255,255,255,0.05)', minHeight: '40px', background: isSubSel ? 'rgba(255,215,0,0.04)' : 'transparent' }}>
                      <button onClick={() => toggleCustom(cat.id, val)} style={{ flex: 1, display: 'flex', alignItems: 'center', background: 'transparent', border: 'none', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
                        <div style={{ width: '40px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: '0.42rem', fontWeight: 700, color: 'rgba(255,215,0,0.4)', textTransform: 'uppercase' }}>EIGEN</span>
                        </div>
                        <span style={{ fontSize: isMobile ? '0.72rem' : '0.75rem', fontWeight: isSubSel ? 800 : 600, color: isSubSel ? '#fff' : 'rgba(255,255,255,0.5)', letterSpacing: '-0.01em' }}>{val}</span>
                      </button>
                      <button onClick={() => removeCustom(cat.id, val)} style={{ width: '32px', flexShrink: 0, background: 'transparent', border: 'none', borderLeft: '1px solid rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.2)', cursor: 'pointer', fontSize: '0.65rem', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>✕</button>
                    </div>
                  )
                })}

                {/* Voeg toe */}
                <div style={{ display: 'flex', alignItems: 'center', minHeight: '40px' }}>
                  <div style={{ width: '40px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.15)', lineHeight: 1 }}>+</span>
                  </div>
                  <input type="text" placeholder="Voeg toe..."
                    value={addInputs[cat.id] || ''}
                    onChange={e => updateAddInput(cat.id, e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustom(cat.id) } }}
                    style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'rgba(255,255,255,0.5)', fontSize: isMobile ? '0.72rem' : '0.75rem', fontWeight: 500, fontFamily: 'inherit', padding: '0 0.4rem' }}
                  />
                  {(addInputs[cat.id] || '').trim().length > 0 && (
                    <button onClick={() => addCustom(cat.id)} style={{ width: '32px', flexShrink: 0, background: 'rgba(255,215,0,0.08)', border: 'none', borderLeft: '1px solid rgba(255,215,0,0.15)', color: '#FFD700', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', alignSelf: 'stretch' }}>+</button>
                  )}
                </div>
              </div>
            )}

            {/* Tekstveld voor 'anders' */}
            {isSel && cat.hasTextField && (
              <div style={{ marginTop: '0.15rem' }}>
                <input type="text" placeholder="Wat eet je dan?"
                  value={textFields[cat.id] || ''}
                  onChange={e => updateText(cat.id, e.target.value)}
                  autoFocus
                  style={{ width: '100%', boxSizing: 'border-box', padding: '0.6rem 0.65rem', background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderLeft: '2px solid rgba(255,215,0,0.3)', borderRadius: '0 6px 6px 0', color: '#fff', fontSize: isMobile ? '0.78rem' : '0.82rem', fontFamily: 'inherit', outline: 'none' }}
                  onFocus={e => { e.target.style.borderColor = 'rgba(255,215,0,0.4)'; e.target.style.background = 'rgba(255,215,0,0.03)' }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.background = '#111' }}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Twee-kolom wrapper ────────────────────────────────────────────────────────
function MaaltijdDrillDown({ maaltijdKey, data, onChange, isMobile }) {
  const cats = MAALTIJD_CONFIG[maaltijdKey].categories
  // Verdeel categorieën over 2 kolommen: links even indices, rechts oneven
  const links  = cats.filter((_, i) => i % 2 === 0)
  const rechts = cats.filter((_, i) => i % 2 === 1)

  return (
    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'flex-start' }}>
      <KolomCards cats={links}  maaltijdKey={maaltijdKey} data={data} onChange={onChange} isMobile={isMobile} />
      <KolomCards cats={rechts} maaltijdKey={maaltijdKey} data={data} onChange={onChange} isMobile={isMobile} />
    </div>
  )
}

// ── Hoofd flow ────────────────────────────────────────────────────────────────
export default function EatPatternFlow({ data, onChange, onNext, onBack, isMobile }) {
  const [step, setStep] = useState(1)
  const update = (field, value) => onChange({ ...data, [field]: value })
  const goBack = () => { if (step > 1) setStep(step - 1); else if (onBack) onBack() }
  const pad = isMobile ? '1.25rem 1rem' : '1.5rem 1.25rem'

  if (step === 1) return (
    <div style={{ padding: pad }}>
      <Q isMobile={isMobile}>Wat eet je of vind je lekker als ontbijt?</Q>
      <Hint isMobile={isMobile}>Tik aan wat je eet of graag eet — kies er minimaal {MIN_ITEMS_PER_MEAL}</Hint>
      <MaaltijdDrillDown maaltijdKey="ontbijt" data={data} onChange={onChange} isMobile={isMobile} />
      <MealItemCounter count={countMealItems('ontbijt', data)} skipped={isMealSkipped('ontbijt', data)} label="Ontbijt" />
      <NextBtn onClick={() => setStep(2)} disabled={!canContinueMeal('ontbijt', data)} isMobile={isMobile} onBack={onBack} />
    </div>
  )

  if (step === 2) return (
    <div style={{ padding: pad }}>
      <Q isMobile={isMobile}>Wat eet je of vind je lekker als lunch?</Q>
      <Hint isMobile={isMobile}>Tik aan wat je eet of graag eet — kies er minimaal {MIN_ITEMS_PER_MEAL}</Hint>
      <MaaltijdDrillDown maaltijdKey="lunch" data={data} onChange={onChange} isMobile={isMobile} />
      <MealItemCounter count={countMealItems('lunch', data)} skipped={isMealSkipped('lunch', data)} label="Lunch" />
      <NextBtn onClick={() => setStep(3)} disabled={!canContinueMeal('lunch', data)} isMobile={isMobile} onBack={goBack} />
    </div>
  )

  if (step === 3) return (
    <div style={{ padding: pad }}>
      <Q isMobile={isMobile}>Wat eet je of vind je lekker als avondeten?</Q>
      <Hint isMobile={isMobile}>Tik aan wat je eet of graag eet — kies er minimaal {MIN_ITEMS_PER_MEAL}</Hint>
      <MaaltijdDrillDown maaltijdKey="diner" data={data} onChange={onChange} isMobile={isMobile} />
      <MealItemCounter count={countMealItems('diner', data)} skipped={isMealSkipped('diner', data)} label="Avondeten" />
      <NextBtn onClick={() => setStep(4)} disabled={!canContinueMeal('diner', data)} isMobile={isMobile} onBack={goBack} />
    </div>
  )

  if (step === 4) return (
    <div style={{ padding: pad }}>
      <Q isMobile={isMobile}>Heb je ooit een periode gehad dat het goed ging met eten?</Q>
      <Hint isMobile={isMobile}>Eerlijk antwoord helpt je coach</Hint>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginBottom: '0.5rem' }}>
        {WERKTE_OPTIONS.map(opt => (
          <BigOption key={opt.value} label={opt.label} sub={opt.sub}
            selected={data.wat_werkte === opt.value}
            onClick={() => update('wat_werkte', opt.value)}
            isMobile={isMobile}
          />
        ))}
      </div>
      {data.wat_werkte === 'ja' && (
        <div style={{ marginBottom: '0.5rem' }}>
          <input type="text" placeholder="Wat deed je toen?"
            value={data.wat_werkte_toelichting || ''}
            onChange={e => update('wat_werkte_toelichting', e.target.value)}
            style={{ width: '100%', boxSizing: 'border-box', padding: isMobile ? '0.8rem 0.9rem' : '0.85rem 1rem', background: '#0d0d0d', border: '1px solid rgba(255,215,0,0.2)', borderLeft: '2px solid rgba(255,215,0,0.4)', borderRadius: '0 8px 8px 0', color: '#fff', fontSize: isMobile ? '0.9rem' : '0.95rem', fontFamily: 'inherit', outline: 'none' }}
          />
        </div>
      )}
      <NextBtn onClick={onNext} disabled={!data.wat_werkte} isMobile={isMobile} onBack={goBack} />
    </div>
  )

  return null
}
