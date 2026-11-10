// src/modules/nutrition-intake/components/nutrition-flow/EatPatternFlow.jsx
// Stap 1-4: Eetpatroon drill-down — 2 kolommen via flex, lijst klapt uit onder card
import React, { useState, useRef } from 'react'
import { createPortal } from '../../../../client/paginaPortal'
import { Check, SkipForward, PenLine, X } from 'lucide-react'
import { Q, Hint, NextBtn, BigOption } from '../../../public-intake/components/phase1/FlowStep'

// Minimum aantal "dingen" dat per maaltijd ingevuld moet zijn vóór doorgaan.
// "Ding" = sub-item (specifiek gerecht), custom toegevoegd item, of een
// niet-lege tekst bij "Iets anders". Wie de maaltijd overslaat (skip_*) mag
// door zonder minimum.
export const MIN_ITEMS_PER_MEAL = 3

export const countMealItems = (key, data) => {
  const subs = data[`${key}_subs`] || []
  const text = data[`${key}_text`] || {}
  const textCount = Object.values(text).filter(t => (t || '').trim()).length
  return subs.length + textCount
}

export const isMealSkipped = (key, data) =>
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
    : done ? 'rgba(16,185,129,0.95)' : 'rgba(255,255,255,0.97)'
  const fg = skipped ? '#fff' : done ? '#fff' : '#000'
  const text = skipped
    ? `${label || 'Maaltijd'} overgeslagen ✓`
    : done
      ? `✓ ${count} dingen ingevuld`
      : `${count} van ${MIN_ITEMS_PER_MEAL}, kies er nog ${remaining}`

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
export const MAALTIJD_CONFIG = {
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
  // Snacks (10 nov 2026): zelfde opbouw als de maaltijden, voor de
  // keuze-modal bij "Wat snack je meestal tussendoor?".
  snack: { label: 'Snack', categories: [
    { id: 'snack_zuivel', label: 'Kwark of yoghurt', image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=160&fit=crop&q=80',
      subs: [
        { id: 'snack_kwark', label: 'Kwark', image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=200&h=120&fit=crop&q=80' },
        { id: 'snack_griekse_yoghurt', label: 'Griekse yoghurt', image: 'https://images.unsplash.com/photo-1584278860047-22db9ff82bed?w=200&h=120&fit=crop&q=80' },
        { id: 'snack_skyr', label: 'Skyr', image: 'https://images.unsplash.com/photo-1559598467-f8b76c8155d0?w=200&h=120&fit=crop&q=80' },
        { id: 'snack_yoghurt_naturel', label: 'Yoghurt', image: 'https://images.unsplash.com/photo-1571212515416-fca988083f0f?w=200&h=120&fit=crop&q=80' },
      ]},
    { id: 'snack_fruit_cat', label: 'Fruit', image: 'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=400&h=160&fit=crop&q=80',
      subs: [
        { id: 'snack_vers_fruit', label: 'Vers fruit', image: 'https://images.unsplash.com/photo-1467825487722-7e6f7060cd44?w=200&h=120&fit=crop&q=80' },
        { id: 'snack_smoothie', label: 'Smoothie', image: 'https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=200&h=120&fit=crop&q=80' },
        { id: 'snack_fruit_yoghurt', label: 'Fruit + yoghurt', image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=200&h=120&fit=crop&q=80' },
      ]},
    { id: 'snack_eiwit', label: 'Eiwitsnacks', image: 'https://images.unsplash.com/photo-1622484212973-65b7b4b10b2b?w=400&h=160&fit=crop&q=80',
      subs: [
        { id: 'snack_eiwitreep', label: 'Proteïnereep', image: 'https://images.unsplash.com/photo-1622484212973-65b7b4b10b2b?w=200&h=120&fit=crop&q=80' },
        { id: 'snack_eiwitshake', label: 'Eiwitshake', image: 'https://images.unsplash.com/photo-1693996046865-19217d179161?w=200&h=120&fit=crop&q=80' },
        { id: 'snack_ei', label: 'Gekookt ei', image: 'https://images.unsplash.com/photo-1607690424560-35d967d46cfa?w=200&h=120&fit=crop&q=80' },
      ]},
    { id: 'snack_hartig', label: 'Hartig', image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&h=160&fit=crop&q=80',
      subs: [
        { id: 'snack_crackers', label: 'Crackers of rijstwafels', image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=200&h=120&fit=crop&q=80' },
        { id: 'snack_kaas', label: 'Kaas', image: 'https://images.unsplash.com/photo-1766085683489-18b663437308?w=200&h=120&fit=crop&q=80' },
        { id: 'snack_noten_cat', label: 'Noten', image: 'https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=200&h=120&fit=crop&q=80' },
        { id: 'snack_boterham', label: 'Boterham', image: 'https://images.unsplash.com/photo-1528736235302-52922df5c122?w=200&h=120&fit=crop&q=80' },
      ]},
    { id: 'snack_zoet', label: 'Zoet of chips', image: 'https://images.unsplash.com/photo-1749281592570-2f743d7d2824?w=400&h=160&fit=crop&q=80',
      subs: [
        { id: 'snack_chips', label: 'Chips', image: 'https://images.unsplash.com/photo-1749281592570-2f743d7d2824?w=200&h=120&fit=crop&q=80' },
        { id: 'snack_koekjes', label: 'Koekjes', image: 'https://images.unsplash.com/photo-1767339300211-00be83435c63?w=200&h=120&fit=crop&q=80' },
        { id: 'snack_chocola', label: 'Chocola', image: 'https://images.unsplash.com/photo-1626697556651-67ebdcb8cbd6?w=200&h=120&fit=crop&q=80' },
        { id: 'snack_snoep', label: 'Snoep', image: 'https://images.unsplash.com/photo-1617627191898-1408bf607b4d?w=200&h=120&fit=crop&q=80' },
      ]},
    { id: 'skip_snack', label: 'Neem ik niet', image: '', subs: [] },
    { id: 'snack_anders', label: 'Iets anders', image: '', subs: [], hasTextField: true },
  ]},
}

const WERKTE_OPTIONS = [
  { value: 'ja',     label: 'Ja, ik weet wat werkt',  sub: 'Ik heb het eerder gedaan' },
  { value: 'beetje', label: 'Een beetje',             sub: 'Maar ben gestopt of werkte matig' },
  { value: 'nee',    label: 'Nee, ik weet het niet', sub: 'Nog nooit echt succesvol geweest' },
]

// Vinkje rechts in een rij: groen gevuld als het aan staat, lege ring als
// het uit staat. Zo zie je in één oogopslag wat je hebt gekozen, zonder dat
// de tekst grijs hoeft te worden.
function Vink({ aan }) {
  return (
    <div style={{ width: 34, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{
        width: 20, height: 20, borderRadius: '50%', boxSizing: 'border-box',
        background: aan ? '#10b981' : 'transparent',
        border: aan ? 'none' : '1.5px solid rgba(255,255,255,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.15s ease',
      }}>
        {aan && <Check size={13} strokeWidth={3.5} color="#fff" />}
      </div>
    </div>
  )
}

// ── Enkelvoudige categorie kolom ──────────────────────────────────────────────
// Elke kolom rendert zijn eigen cards + uitgeklapte lijsten
function KolomCards({ cats, maaltijdKey, data, onChange, isMobile }) {
  const selected   = data[`${maaltijdKey}_categories`] || []
  const selSubs    = data[`${maaltijdKey}_subs`] || []
  const textFields = data[`${maaltijdKey}_text`] || {}
  const customItems = data[`${maaltijdKey}_custom`] || {}
  const addInputs  = data[`${maaltijdKey}_addinput`] || {}
  // Na toevoegen terug naar het veld: je typt er meestal meer dan één achter
  // elkaar, en opnieuw moeten aantikken breekt dat ritme.
  const addRefs = useRef({})

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
    setTimeout(() => addRefs.current[catId]?.focus(), 0)
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

        // "Sla ik over" en "Iets anders": geen fotokaart, maar een compacte
        // rij met een icoon. Scheelt veel ruimte.
        const isCompact = cat.id.startsWith('skip_') || cat.hasTextField
        if (isCompact) {
          const Icoon = cat.id.startsWith('skip_') ? SkipForward : PenLine
          return (
            <div key={cat.id}>
              <button onClick={() => toggleCat(cat.id)} style={{
                width: '100%', minHeight: 46, padding: '0 0 0 0.75rem',
                display: 'flex', alignItems: 'center', gap: 10,
                background: isSel ? 'rgba(16,185,129,0.12)' : '#0d0d0d',
                border: `1px solid ${isSel ? 'rgba(16,185,129,0.6)' : 'rgba(255,255,255,0.12)'}`,
                borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', color: '#fff',
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', transition: 'all 0.15s ease',
              }}>
                <Icoon size={17} strokeWidth={2.4} style={{ flexShrink: 0 }} />
                <span style={{ flex: 1, minWidth: 0, fontSize: isMobile ? '0.8rem' : '0.84rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cat.label}</span>
                <Vink aan={isSel} />
              </button>
              {/* "Iets anders": meerdere regels. Typ, tik op het vinkje (of
                  Enter) en de regel staat in de lijst; het veld is weer leeg
                  voor de volgende. Gaat via de bestaande eigen-items
                  (`_custom`), dus telt mee en komt in het invulvak. */}
              {isSel && cat.hasTextField && (
                <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {/* Oude losse tekst (van vóór 10 nov) blijft zichtbaar en wisbaar */}
                  {(textFields[cat.id] || '').trim() && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 40, padding: '0 0 0 0.7rem', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.4)', borderRadius: 10 }}>
                      <span style={{ flex: 1, minWidth: 0, fontSize: isMobile ? '0.82rem' : '0.85rem', fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{textFields[cat.id]}</span>
                      <button onClick={() => updateText(cat.id, '')} aria-label="Weghalen" style={{ width: 36, alignSelf: 'stretch', background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={15} strokeWidth={2.6} /></button>
                    </div>
                  )}
                  {(customItems[cat.id] || []).map(val => (
                    <div key={val} style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 40, padding: '0 0 0 0.7rem', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.4)', borderRadius: 10 }}>
                      <span style={{ flex: 1, minWidth: 0, fontSize: isMobile ? '0.82rem' : '0.85rem', fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{val}</span>
                      <button onClick={() => removeCustom(cat.id, val)} aria-label={`${val} weghalen`} style={{ width: 36, alignSelf: 'stretch', background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={15} strokeWidth={2.6} /></button>
                    </div>
                  ))}
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input type="text"
                      ref={el => { addRefs.current[cat.id] = el }}
                      placeholder={(customItems[cat.id] || []).length ? 'Nog iets?' : 'Wat eet je dan?'}
                      value={addInputs[cat.id] || ''}
                      onChange={e => updateAddInput(cat.id, e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustom(cat.id) } }}
                      autoFocus
                      style={{ flex: 1, minWidth: 0, boxSizing: 'border-box', minHeight: 42, padding: '0 0.7rem', background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, color: '#fff', fontSize: isMobile ? '0.85rem' : '0.88rem', fontWeight: 600, fontFamily: 'inherit', outline: 'none' }}
                    />
                    {(() => {
                      const kan = !!(addInputs[cat.id] || '').trim()
                      return (
                        <button onClick={() => addCustom(cat.id)} disabled={!kan} aria-label="Toevoegen" style={{
                          width: 42, height: 42, flexShrink: 0, borderRadius: 10, padding: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: kan ? '#10b981' : 'rgba(255,255,255,0.06)',
                          border: kan ? 'none' : '1px solid rgba(255,255,255,0.15)',
                          color: kan ? '#fff' : 'rgba(255,255,255,0.3)',
                          cursor: kan ? 'pointer' : 'default', transition: 'all 0.15s ease',
                          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                        }}><Check size={18} strokeWidth={3} /></button>
                      )
                    })()}
                  </div>
                </div>
              )}
            </div>
          )
        }

        return (
          <div key={cat.id}>
            {/* Card */}
            <button onClick={() => toggleCat(cat.id)} style={{
              width: '100%', padding: 0, overflow: 'hidden',
              background: isSel ? 'rgba(255,255,255,0.04)' : '#0a0a0a',
              border: `1px solid ${isSel ? 'rgba(16,185,129,0.7)' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: 10,
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
                {isSel && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)' }} />}
                <div style={{ position: 'absolute', bottom: '0.35rem', right: '0.35rem', width: '20px', height: '20px', borderRadius: '50%', boxSizing: 'border-box', border: isSel ? 'none' : '1.5px solid rgba(255,255,255,0.6)', background: isSel ? '#10b981' : 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s ease' }}>
                  {isSel && <Check size={13} strokeWidth={3.5} color="#fff" />}
                </div>
              </div>
              {/* Label */}
              <div style={{ padding: isMobile ? '0.4rem 0.5rem' : '0.45rem 0.6rem' }}>
                <div style={{ fontSize: isMobile ? '0.78rem' : '0.82rem', fontWeight: 800, color: isSel ? '#fff' : '#fff', lineHeight: 1.2, letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {cat.label}
                </div>
                {isSel && cat.subs.length > 0 && (
                  <div style={{ fontSize: '0.6rem', fontWeight: 800, color: subCount > 0 ? '#10b981' : 'rgba(255,255,255,0.6)', marginTop: '0.15rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {subCount > 0 ? `${subCount} ↓` : 'Kies ↓'}
                  </div>
                )}
              </div>
            </button>

            {/* Subcategorieen — zelfde breedte als card */}
            {isSel && cat.subs.length > 0 && (
              <div style={{ marginTop: '0.25rem', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, overflow: 'hidden', background: '#0d0d0d' }}>
                {/* Vaste subs */}
                {cat.subs.map((sub) => {
                  const isSubSel = selSubs.includes(sub.id)
                  return (
                    <button key={sub.id} onClick={() => toggleSub(sub.id)} style={{
                      width: '100%', display: 'flex', alignItems: 'stretch',
                      background: isSubSel ? 'rgba(16,185,129,0.12)' : 'transparent',
                      border: 'none', borderBottom: '1px solid rgba(255,255,255,0.07)',
                      cursor: 'pointer', fontFamily: 'inherit',
                      touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                      transition: 'background 0.15s ease', minHeight: '40px',
                    }}>
                      <div style={{ width: '40px', flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${sub.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0, padding: '0 0.5rem', display: 'flex', alignItems: 'center' }}>
                        <span style={{ fontSize: isMobile ? '0.8rem' : '0.82rem', fontWeight: 700, color: '#fff', letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub.label}</span>
                      </div>
                      <Vink aan={isSubSel} />
                    </button>
                  )
                })}

                {/* Custom items */}
                {(customItems[cat.id] || []).map(val => {
                  const isSubSel = selSubs.includes(`${cat.id}_custom_${val}`)
                  return (
                    <div key={val} style={{ display: 'flex', alignItems: 'stretch', borderBottom: '1px solid rgba(255,255,255,0.07)', minHeight: '40px', background: isSubSel ? 'rgba(16,185,129,0.12)' : 'transparent' }}>
                      <button onClick={() => toggleCustom(cat.id, val)} style={{ flex: 1, display: 'flex', alignItems: 'center', background: 'transparent', border: 'none', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
                        <div style={{ width: '40px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <PenLine size={14} strokeWidth={2.4} color="#fff" />
                        </div>
                        <span style={{ flex: 1, minWidth: 0, textAlign: 'left', fontSize: isMobile ? '0.8rem' : '0.82rem', fontWeight: 700, color: '#fff', letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{val}</span>
                        <Vink aan={isSubSel} />
                      </button>
                      <button onClick={() => removeCustom(cat.id, val)} style={{ width: '32px', flexShrink: 0, background: 'transparent', border: 'none', borderLeft: '1px solid rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.2)', cursor: 'pointer', fontSize: '0.65rem', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>✕</button>
                    </div>
                  )
                })}

                {/* Zelf toevoegen: laatste rij van de lijst, zelfde maat als
                    de andere rijen. Typ, tik op het vinkje (of Enter), en het
                    veld is leeg voor de volgende. */}
                {(() => {
                  const kan = !!(addInputs[cat.id] || '').trim()
                  return (
                    <div style={{ display: 'flex', alignItems: 'stretch', minHeight: 40 }}>
                      <div style={{ width: 40, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.6)' }}>
                        <PenLine size={14} strokeWidth={2.4} />
                      </div>
                      <input type="text"
                        ref={el => { addRefs.current[cat.id] = el }}
                        placeholder="Zelf iets toevoegen…"
                        value={addInputs[cat.id] || ''}
                        onChange={e => updateAddInput(cat.id, e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustom(cat.id) } }}
                        style={{
                          flex: 1, minWidth: 0, padding: '0 0.5rem',
                          background: 'none', border: 'none', outline: 'none', color: '#fff',
                          fontSize: isMobile ? '0.8rem' : '0.82rem', fontWeight: 700, fontFamily: 'inherit',
                        }}
                      />
                      <button onClick={() => addCustom(cat.id)} disabled={!kan} aria-label="Toevoegen" style={{
                        width: 34, flexShrink: 0, padding: 0, background: 'none', border: 'none',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: kan ? 'pointer' : 'default',
                        touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                      }}>
                        <div style={{
                          width: 22, height: 22, borderRadius: '50%',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: kan ? '#10b981' : 'rgba(255,255,255,0.08)',
                          color: kan ? '#fff' : 'rgba(255,255,255,0.3)', transition: 'all 0.15s ease',
                        }}><Check size={13} strokeWidth={3.5} /></div>
                      </button>
                    </div>
                  )
                })()}
              </div>
            )}

            {/* Tekstveld voor 'anders' */}
            {isSel && cat.hasTextField && (
              <div style={{ marginTop: '0.15rem' }}>
                <input type="text" placeholder="Wat eet je dan?"
                  value={textFields[cat.id] || ''}
                  onChange={e => updateText(cat.id, e.target.value)}
                  autoFocus
                  style={{ width: '100%', boxSizing: 'border-box', padding: '0.6rem 0.65rem', background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderLeft: '2px solid rgba(255,255,255,0.3)', borderRadius: '0 6px 6px 0', color: '#fff', fontSize: isMobile ? '0.78rem' : '0.82rem', fontFamily: 'inherit', outline: 'none' }}
                  onFocus={e => { e.target.style.borderColor = 'rgba(255,255,255,0.4)'; e.target.style.background = 'rgba(255,255,255,0.03)' }}
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
export function MaaltijdDrillDown({ maaltijdKey, data, onChange, isMobile, tweeKolommen }) {
  const cats = MAALTIJD_CONFIG[maaltijdKey].categories
  // Verdeel categorieën over 2 kolommen: links even indices, rechts oneven
  const links  = cats.filter((_, i) => i % 2 === 0)
  const rechts = cats.filter((_, i) => i % 2 === 1)

  // On mobile, single column to avoid visual confusion when a card expands
  // its sub-list next to options in the adjacent column.
  // tweeKolommen: in de keuze-modal ook op mobiel naast elkaar (10 nov 2026).
  if (isMobile && !tweeKolommen) return (
    <div>
      <KolomCards cats={cats} maaltijdKey={maaltijdKey} data={data} onChange={onChange} isMobile={isMobile} />
    </div>
  )

  return (
    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'flex-start' }}>
      <KolomCards cats={links}  maaltijdKey={maaltijdKey} data={data} onChange={onChange} isMobile={isMobile} />
      <KolomCards cats={rechts} maaltijdKey={maaltijdKey} data={data} onChange={onChange} isMobile={isMobile} />
    </div>
  )
}

// ── Hoofd flow ────────────────────────────────────────────────────────────────
export default function EatPatternFlow({ data, onChange, onNext, onBack, isMobile }) {
  // Sinds 10 nov 2026 kiest de klant wat hij lekker vindt (stap 1-3) in de
  // Suggesties-modal bij "Wat eet je nu" (CurrentMealsFlow). Hier blijft alleen
  // stap 4 over: eerder een goede periode gehad.
  const [step, setStep] = useState(4)
  const update = (field, value) => onChange({ ...data, [field]: value })
  const goBack = () => { if (step > 4) setStep(step - 1); else if (onBack) onBack() }
  const pad = isMobile ? '1.25rem 1rem' : '1.5rem 1.25rem'

  if (step === 1) return (
    <div style={{ padding: pad }}>
      <Q isMobile={isMobile}>Wat eet je of vind je lekker als ontbijt?</Q>
      <Hint isMobile={isMobile}>Tik aan wat je eet of graag eet, kies er minimaal {MIN_ITEMS_PER_MEAL}</Hint>
      <MaaltijdDrillDown maaltijdKey="ontbijt" data={data} onChange={onChange} isMobile={isMobile} />
      <MealItemCounter count={countMealItems('ontbijt', data)} skipped={isMealSkipped('ontbijt', data)} label="Ontbijt" />
      <NextBtn onClick={() => setStep(2)} disabled={!canContinueMeal('ontbijt', data)} isMobile={isMobile} onBack={onBack} />
    </div>
  )

  if (step === 2) return (
    <div style={{ padding: pad }}>
      <Q isMobile={isMobile}>Wat eet je of vind je lekker als lunch?</Q>
      <Hint isMobile={isMobile}>Tik aan wat je eet of graag eet, kies er minimaal {MIN_ITEMS_PER_MEAL}</Hint>
      <MaaltijdDrillDown maaltijdKey="lunch" data={data} onChange={onChange} isMobile={isMobile} />
      <MealItemCounter count={countMealItems('lunch', data)} skipped={isMealSkipped('lunch', data)} label="Lunch" />
      <NextBtn onClick={() => setStep(3)} disabled={!canContinueMeal('lunch', data)} isMobile={isMobile} onBack={goBack} />
    </div>
  )

  if (step === 3) return (
    <div style={{ padding: pad }}>
      <Q isMobile={isMobile}>Wat eet je of vind je lekker als avondeten?</Q>
      <Hint isMobile={isMobile}>Tik aan wat je eet of graag eet, kies er minimaal {MIN_ITEMS_PER_MEAL}</Hint>
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
        <div style={{ margin: '0.6rem 0 0.7rem' }}>
          <div style={{ fontSize: isMobile ? '0.95rem' : '1rem', fontWeight: 900, color: '#fff', marginBottom: '0.45rem' }}>Wat deed je toen?</div>
          <input type="text" placeholder="Bijv: elke dag mijn eten bijgehouden, veel eiwit, geen snoep door de week"
            value={data.wat_werkte_toelichting || ''}
            onChange={e => update('wat_werkte_toelichting', e.target.value)}
            autoFocus
            style={{ width: '100%', boxSizing: 'border-box', minHeight: 48, padding: isMobile ? '0.75rem 0.9rem' : '0.8rem 1rem', background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 14, color: '#fff', fontSize: isMobile ? '0.9rem' : '0.95rem', fontWeight: 600, fontFamily: 'inherit', outline: 'none' }}
          />
        </div>
      )}
      {/* Bij "ja" is "Wat deed je toen?" verplicht (10 nov 2026). */}
      <NextBtn onClick={onNext} disabled={!data.wat_werkte || (data.wat_werkte === 'ja' && !(data.wat_werkte_toelichting || '').trim())} isMobile={isMobile} onBack={goBack} />
    </div>
  )

  return null
}
