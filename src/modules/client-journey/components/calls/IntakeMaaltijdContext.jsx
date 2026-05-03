// src/modules/client-journey/components/calls/IntakeMaaltijdContext.jsx
// Read-only weergave van intake maaltijden tijdens de call flow
// 4 kolommen: Ontbijt / Lunch / Diner / Info
import React from 'react'
import { C } from './IntakeCallHelpers'

// ── Volledige data uit EatPatternFlow ──
const MAALTIJD_CONFIG = {
  ontbijt: {
    label: 'Ontbijt',
    emoji: '🌅',
    categories: [
      { id: 'brood', label: 'Brood', image: 'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=400&h=160&fit=crop&q=80',
        subs: { brood_kaas:'Brood+kaas', brood_vleeswaren:'Brood+vlees', brood_pindakaas:'Pindakaas', brood_choco:'Chocopasta', brood_ei:'Ei op brood', toast_avocado:'Toast avocado' }},
      { id: 'havermout', label: 'Havermout', image: 'https://images.unsplash.com/photo-1515543904379-3d757afe72e4?w=400&h=160&fit=crop&q=80',
        subs: { havermout_fruit:'Fruit', havermout_noten:'Noten', kwark_fruit:'Kwark+fruit', griekse_yoghurt:'Griekse yoghurt', skyr:'Skyr', smoothie_bowl:'Smoothie bowl' }},
      { id: 'eieren', label: 'Eieren', image: 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=400&h=160&fit=crop&q=80',
        subs: { eieren_gebakken:'Gebakken', eieren_scrambled:'Scrambled', omelet:'Omelet', eieren_gekookt:'Gekookt', roerei_toast:'Roerei toast' }},
      { id: 'fruit', label: 'Fruit', image: 'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=400&h=160&fit=crop&q=80',
        subs: { fruit_vers:'Vers fruit', smoothie:'Smoothie', fruit_yoghurt:'Fruit+yoghurt', muesli:'Muesli' }},
      { id: 'ontbijt_anders', label: 'Anders', image: 'https://images.unsplash.com/photo-1493770348161-369560ae357d?w=400&h=160&fit=crop&q=80', subs: {} },
      { id: 'skip_ontbijt', label: 'Sla over', image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=160&fit=crop&q=80', subs: {} },
    ]
  },
  lunch: {
    label: 'Lunch',
    emoji: '☀️',
    categories: [
      { id: 'lunch_brood', label: 'Brood/wrap', image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400&h=160&fit=crop&q=80',
        subs: { lunch_brood_kaas:'Brood+kaas', lunch_brood_vlees:'Brood+vlees', lunch_wrap_kip:'Wrap kip', lunch_wrap_groenten:'Wrap groenten', lunch_tosti:'Tosti', lunch_shoarma:'Shoarma' }},
      { id: 'lunch_salade', label: 'Salade/soep', image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=160&fit=crop&q=80',
        subs: { salade_kip:'Salade kip', salade_tonijn:'Salade tonijn', salade_ei:'Salade ei', soep:'Soep', soep_brood:'Soep+brood' }},
      { id: 'lunch_warm', label: 'Warm', image: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=400&h=160&fit=crop&q=80',
        subs: { lunch_rijst:'Rijst', lunch_pasta:'Pasta', lunch_wok:'Wok', lunch_noodles:'Noodles' }},
      { id: 'lunch_snacks', label: 'Snacks', image: 'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=400&h=160&fit=crop&q=80',
        subs: { snack_noten:'Noten', snack_fruit:'Fruit', snack_reep:'Proteïnereep', snack_yoghurt:'Yoghurt', snack_cracker:'Crackers' }},
      { id: 'skip_lunch', label: 'Sla over', image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=160&fit=crop&q=80', subs: {} },
      { id: 'lunch_anders', label: 'Anders', image: 'https://images.unsplash.com/photo-1493770348161-369560ae357d?w=400&h=160&fit=crop&q=80', subs: {} },
    ]
  },
  diner: {
    label: 'Diner',
    emoji: '🌙',
    categories: [
      { id: 'diner_rijst', label: 'Rijst', image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&h=160&fit=crop&q=80',
        subs: { rijst_kip:'Kip', rijst_rund:'Rund', rijst_zalm:'Zalm', rijst_groenten:'Groenten', nasi:'Nasi' }},
      { id: 'diner_pasta', label: 'Pasta', image: 'https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=400&h=160&fit=crop&q=80',
        subs: { pasta_bolognese:'Bolognese', pasta_carbonara:'Carbonara', pasta_kip:'Kip', pasta_zalm:'Zalm', bami:'Bami', noodles:'Noodles' }},
      { id: 'diner_aardappelen', label: 'Aardappelen', image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&h=160&fit=crop&q=80',
        subs: { aard_kip:'Kip', aard_vlees:'Vlees', aard_vis:'Vis', stamppot:'Stamppot', friet:'Friet' }},
      { id: 'diner_soep', label: 'Soep/salade', image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&h=160&fit=crop&q=80',
        subs: { soep_kip:'Kippensoep', soep_groente:'Groentesoep', soep_tomaat:'Tomatensoep', salade_diner:'Grote salade' }},
      { id: 'diner_besteld', label: 'Besteld', image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=160&fit=crop&q=80',
        subs: { pizza:'Pizza', shoarma:'Shoarma', hamburger:'Hamburger', sushi:'Sushi', chinees:'Chinees', indiaas:'Indiaas' }},
      { id: 'diner_anders', label: 'Anders', image: 'https://images.unsplash.com/photo-1493770348161-369560ae357d?w=400&h=160&fit=crop&q=80', subs: {} },
    ]
  }
}

function MaaltijdKolom({ maaltijdKey, np, isMobile }) {
  const config = MAALTIJD_CONFIG[maaltijdKey]
  const wishes = np?.wishes || {}
  const selectedCats = wishes[`${maaltijdKey}_categories`] || []
  const selectedSubs = wishes[`${maaltijdKey}_subs`] || []

  const activeCats = config.categories.filter(cat => selectedCats.includes(cat.id))
  if (activeCats.length === 0) return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: '0.4rem', fontWeight: 700, color: C.text25, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.3rem' }}>
        {config.emoji} {config.label}
      </div>
      <div style={{ fontSize: '0.58rem', color: C.text15, fontStyle: 'italic' }}>Niet ingevuld</div>
    </div>
  )

  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
      <div style={{ fontSize: '0.4rem', fontWeight: 700, color: C.text25, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.1rem' }}>
        {config.emoji} {config.label}
      </div>
      {activeCats.map(cat => {
        const activeSubs = Object.entries(cat.subs)
          .filter(([id]) => selectedSubs.includes(id))
          .map(([, label]) => label)

        return (
          <div key={cat.id} style={{
            border: `1px solid rgba(255,215,0,0.15)`,
            borderRadius: '6px',
            overflow: 'hidden'
          }}>
            {/* Foto */}
            <div style={{
              height: '44px',
              backgroundImage: `url(${cat.image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 100%)'
              }} />
              <div style={{
                position: 'absolute', bottom: '0.25rem', left: '0.375rem',
                fontSize: '0.55rem', fontWeight: 800, color: C.gold,
                letterSpacing: '-0.01em'
              }}>{cat.label}</div>
            </div>

            {/* Subs */}
            {activeSubs.length > 0 && (
              <div style={{ padding: '0.25rem 0.375rem', background: 'rgba(255,215,0,0.02)' }}>
                {activeSubs.map((sub, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: '0.25rem',
                    padding: '0.1rem 0',
                    borderBottom: i < activeSubs.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none'
                  }}>
                    <div style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'rgba(255,215,0,0.4)', flexShrink: 0 }} />
                    <span style={{ fontSize: '0.55rem', fontWeight: 600, color: C.text50 }}>{sub}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function InfoKolom({ np, cd, isMobile }) {
  const wishes = np?.wishes || {}
  const rows = [
    wishes.niet_lekker?.length && { label: '⛔ Niet lekker', value: wishes.niet_lekker.join(', '), color: 'rgba(239,68,68,0.7)' },
    np?.allergens?.selected_allergens?.length && { label: '⚠️ Allergie', value: np.allergens.selected_allergens.join(', '), color: 'rgba(239,68,68,0.7)' },
    np?.allergens?.diet_preference && np.allergens.diet_preference !== 'geen' && { label: '🥗 Dieet', value: { vegetarisch:'Vegetarisch', veganistisch:'Veganistisch', halal:'Halal', pescotarisch:'Pescotarisch' }[np.allergens.diet_preference] },
    np?.meal_schedule?.num_meals && { label: '🍽️ Maaltijden', value: `${np.meal_schedule.num_meals}x per dag` },
    np?.life_context?.weekly_budget && { label: '💰 Budget', value: `€${np.life_context.weekly_budget}/week` },
    np?.life_context?.cooking_preference && { label: '👨‍🍳 Koken', value: { graag:'Kookt graag', neutraal:'Maakt niet uit', niet_graag:'Zo min mogelijk' }[np.life_context.cooking_preference] },
    cd?.cooking_time && { label: '⏱️ Kooktijd', value: `${cd.cooking_time} min` },
    np?.cheat_meals?.frequency && { label: '🍕 Cheat', value: { nooit:'Geen', '1x_week':'1x/week', weekend:'Weekend', als_nodig:'Als nodig' }[np.cheat_meals.frequency] },
    np?.supplement_preferences?.openness && { label: '💊 Supps', value: { ja_graag:'Wil supplementen', basics:'Alleen basics', liever_niet:'Liever niet', nee:'Geen' }[np.supplement_preferences.openness] },
    np?.practical_info?.macros_kennis && { label: '📊 Macro kennis', value: { ja:'Kent macro\'s', beetje:'Beetje', nee:'Geen kennis' }[np.practical_info.macros_kennis] },
    np?.practical_info?.calorieen_geteld && { label: '🔢 Calorieën', value: { ja:'Bijgehouden', soms:'Soms', nee:'Nooit' }[np.practical_info.calorieen_geteld] },
    wishes.wat_werkte && { label: '✅ Werkte eerder', value: { ja:'Ja, weet wat werkt', beetje:'Een beetje', nee:'Weet het niet' }[wishes.wat_werkte] },
    wishes.wat_werkte_toelichting && { label: '→ Wat werkte', value: wishes.wat_werkte_toelichting },
  ].filter(Boolean)

  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: '0.4rem', fontWeight: 700, color: C.text25, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.3rem' }}>
        ℹ️ Info
      </div>
      <div style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: '6px', overflow: 'hidden' }}>
        {rows.map((row, i) => (
          <div key={i} style={{
            display: 'flex', flexDirection: 'column',
            padding: '0.25rem 0.375rem',
            borderBottom: i < rows.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
            background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)'
          }}>
            <span style={{ fontSize: '0.38rem', fontWeight: 700, color: C.text25, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{row.label}</span>
            <span style={{ fontSize: '0.6rem', fontWeight: 600, color: row.color || C.text50, lineHeight: 1.3 }}>{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function IntakeMaaltijdContext({ np, cd, isMobile }) {
  if (!np) return null

  return (
    <div style={{
      margin: '0 0 0.875rem 0',
      border: '1px solid rgba(255,215,0,0.1)',
      borderRadius: '8px',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: '0.3rem 0.625rem',
        borderBottom: '1px solid rgba(255,215,0,0.08)',
        background: 'rgba(255,215,0,0.02)'
      }}>
        <span style={{ fontSize: '0.38rem', fontWeight: 700, color: 'rgba(255,215,0,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          INTAKE — VOEDING
        </span>
      </div>

      {/* 4 kolommen */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        padding: '0.5rem',
        alignItems: 'flex-start',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch'
      }}>
        <MaaltijdKolom maaltijdKey="ontbijt" np={np} isMobile={isMobile} />
        <MaaltijdKolom maaltijdKey="lunch" np={np} isMobile={isMobile} />
        <MaaltijdKolom maaltijdKey="diner" np={np} isMobile={isMobile} />
        <InfoKolom np={np} cd={cd} isMobile={isMobile} />
      </div>
    </div>
  )
}
