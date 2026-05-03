// src/modules/client-journey/components/calls/IntakeNutritionStep1.jsx
// v4.0 — Fixed: vegetable_preferences, np.calorie_target/tdee, cheat_meals social fields,
//         supplement current_supplements (was current_supps), wishes.priority_ranking
import React, { useState } from 'react'
import { Utensils, ChevronDown, ChevronRight } from 'lucide-react'
import { C, StatBar } from './IntakeCallHelpers'

const HERO = 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&q=80'

const STANDARD_PROTEIN = ['Kipfilet', 'Eieren', 'Magere kwark', 'Zalm', 'Mager rundvlees', 'Whey protein', 'Gehakt', 'Kalkoenfilet', 'Tonijn (blik)', 'Griekse yoghurt', 'Cottage cheese', 'Garnalen']
const STANDARD_CARBS = ['Witte rijst', 'Havermout', 'Zoete aardappel', 'Basmati rijst', 'Volkoren pasta', 'Brood (volkoren)', 'Wraps / Tortilla\'s', 'Aardappelen', 'Couscous', 'Quinoa']
const STANDARD_FATS = ['Olijfolie', 'Noten (amandelen/walnoten)', 'Avocado', 'Pindakaas', 'Kaas', 'Roomboter', 'Kokosolie', 'Eierdooiers']
const STANDARD_VEGS = ['Broccoli', 'Spinazie', 'Paprika', 'Komkommer', 'Tomaat', 'Wortel', 'Courgette', 'Bloemkool', 'Sla / Rucola', 'Champignons', 'Sperziebonen', 'Maïs (blik)', 'Ui / Knoflook', 'Doperwten']

export default function IntakeNutritionStep1({ cd, np, prac, getRemovals, getAdditions, isMobile, onNext }) {
  const [expandedSections, setExpandedSections] = useState({})
  const toggle = (key) => setExpandedSections(p => ({ ...p, [key]: !p[key] }))

  const gl = np?.guidance_level?.guidance_level || null
  const lc = np?.life_context || {}
  const tr = np?.training || {}
  const al = np?.allergens || {}
  const cm = np?.cheat_meals || {}
  const wi = np?.wishes || {}
  const sp = np?.supplement_preferences || {}

  // Targets — prefer nutrition_preferences values, fall back to clients
  const kcalTarget = np?.calorie_target || cd.target_calories || cd.calorie_target
  const tdeeVal = np?.tdee || cd.tdee
  const surplusVal = np?.surplus || cd.surplus

  const guidanceLabels = { strict: 'Strict coachplan', flexible: 'Flexibel plan', free: 'Vrij met richtlijnen' }
  const workLabels = { thuis: 'Thuiswerker', kantoor: 'Kantoor', fysiek: 'Fysiek werk', student: 'Student', wisselend: 'Wisselend', anders: 'Anders' }
  const lunchLabels = { echte_pauze: 'Echte pauze', aan_bureau: 'Aan bureau', geen_pauze: 'Geen pauze' }
  const snackLabels = { makkelijk: 'Ja makkelijk', soms: 'Soms even snel', nee: 'Nee niet echt' }
  const cookLabels = { graag: 'Kookt graag', neutraal: 'Neutraal', niet_graag: 'Simpel & snel' }
  const prepLabels = { preppen: 'Prept vooruit', mix: 'Mix prep/vers', dagelijks: 'Elke dag bereiden', ja: 'Prept vooruit', nee: 'Elke dag vers' }
  const timeLabels = { vroege_ochtend: 'Vroege ochtend', late_ochtend: 'Late ochtend', vroege_middag: 'Vroege middag', late_middag: 'Late middag', vroege_avond: 'Vroege avond', late_avond: 'Late avond', ochtend: 'Ochtend', middag: 'Middag', einde_werkdag: 'Einde werkdag', avond: 'Avond' }
  const cheatFreqLabels = { nooit: 'Geen cheat meals', '1x_week': '1x/week', '2x_week': '2x/week', weekend: 'Weekend', als_nodig: 'Als nodig' }
  const cheatApproachLabels = { strict_plan: 'Geen uitzonderingen', one_free_meal: '1 vrije maaltijd/week', flexible_weekend: 'Weekend flexibel', macro_fit: 'Alles als het past' }
  const suppOpennessLabels = { ja_graag: 'Open voor supps', basics: 'Alleen basis', liever_niet: 'Liever niet', nee: 'Geen supps' }
  const priorityLabels = { variatie: 'Variatie', simpelheid: 'Simpelheid', smaak: 'Smaak', prijs: 'Lage prijs', snelheid: 'Snelle bereiding', gezondheid: 'Gezondheid', portiegrootte: 'Portiegrootte' }

  const hasAlerts = al.selected_allergens?.length > 0 || (al.diet_preference && al.diet_preference !== 'geen')

  const categories = [
    { label: 'EIWIT', standard: STANDARD_PROTEIN, key: 'protein_preferences' },
    { label: 'CARBS', standard: STANDARD_CARBS, key: 'carb_preferences' },
    { label: 'VETTEN', standard: STANDARD_FATS, key: 'fat_preferences' },
    { label: 'GROENTEN', standard: STANDARD_VEGS, key: 'vegetable_preferences' }
  ]
  const catsWithChanges = categories.filter(cat => getRemovals(cat.key).length > 0 || getAdditions(cat.key).length > 0)
  const catsStandard = categories.filter(cat => getRemovals(cat.key).length === 0 && getAdditions(cat.key).length === 0)

  return (
    <div>
      {/* Hero */}
      <div style={{ position: 'relative', height: '90px', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${HERO})`, backgroundSize: 'cover', backgroundPosition: 'center 40%' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #0a0a0a 0%, rgba(0,0,0,0.3) 50%, transparent 100%)' }} />
        <div style={{ position: 'absolute', bottom: '0.5rem', left: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Utensils size={16} color={C.green} />
          <span style={{ fontSize: isMobile ? '0.9rem' : '1rem', fontWeight: 800, color: C.text }}>Voeding overzicht</span>
        </div>
      </div>

      {/* ── BEGELEIDINGSNIVEAU ── */}
      {gl && (
        <div style={{ borderLeft: `3px solid ${C.gold}` }}>
          <Label text="BEGELEIDINGSNIVEAU" color={C.gold} />
          <div style={{ padding: '0.2rem 0.75rem 0.35rem' }}>
            <span style={{ fontSize: isMobile ? '0.85rem' : '0.95rem', fontWeight: 800, color: C.gold }}>{guidanceLabels[gl] || gl}</span>
          </div>
        </div>
      )}

      {/* ── TARGETS — nutrition_preferences first, fallback clients ── */}
      <Label text="MACRO TARGETS" />
      <StatBar isMobile={isMobile} stats={[
        { label: 'KCAL', value: kcalTarget || '—', unit: '/dag', color: C.gold },
        { label: 'EIWIT', value: cd.target_protein || '—', unit: 'g' },
        { label: 'CARBS', value: cd.target_carbs || '—', unit: 'g' },
        { label: 'VET', value: cd.target_fat || '—', unit: 'g' }
      ]} />
      {/* TDEE + surplus alleen als beschikbaar */}
      {(tdeeVal || surplusVal) && (
        <StatBar isMobile={isMobile} stats={[
          tdeeVal ? { label: 'TDEE', value: tdeeVal, unit: 'kcal' } : null,
          surplusVal ? { label: surplusVal > 0 ? 'SURPLUS' : 'DEFICIT', value: Math.abs(surplusVal), unit: 'kcal', color: surplusVal > 0 ? C.green : C.gold } : null
        ].filter(Boolean)} />
      )}

      {/* ── JOUW LEVEN ── */}
      {lc.work_situation && (
        <>
          <Label text="LEVENSSITUATIE" />
          <StatBar isMobile={isMobile} stats={[
            { label: 'WERK', value: workLabels[lc.work_situation] || lc.work_situation },
            { label: 'UREN', value: lc.work_hours || '—' },
            { label: 'BUDGET', value: lc.weekly_budget ? `€${lc.weekly_budget}` : '—', unit: '/wk' }
          ]} />
          <StatBar isMobile={isMobile} stats={[
            { label: 'KOKEN', value: cookLabels[lc.cooking_preference] || '—' },
            { label: 'KOOKTIJD', value: lc.available_cook_time ? `${lc.available_cook_time} min` : '—' },
            { label: 'PREP', value: prepLabels[lc.meal_prep_preference] || '—' }
          ]} />
          <StatBar isMobile={isMobile} stats={[
            { label: 'LUNCH', value: lunchLabels[lc.lunch_situation] || '—' },
            { label: 'TUSSENDOOR', value: snackLabels[lc.snacking_possible] || '—' }
          ]} />
          {lc.work_days?.length > 0 && (
            <Row label="WERKDAGEN" value={lc.work_days.map(d => d.toUpperCase()).join(' · ')} isMobile={isMobile} />
          )}
        </>
      )}

      {/* ── TRAINING ── */}
      {tr.training_days?.length > 0 && (
        <>
          <Label text="TRAINING" />
          <StatBar isMobile={isMobile} stats={[
            { label: 'DAGEN', value: `${tr.training_days.length}x/week`, color: C.green },
            { label: 'TIJD', value: tr.varies_per_day ? 'Wisselend' : (timeLabels[tr.default_time] || '—') },
            { label: 'DUUR', value: tr.training_duration || '—' }
          ]} />
          <Row label="TRAININGSDAGEN" value={tr.training_days.map(d => d.toUpperCase()).join(' · ')} isMobile={isMobile} />
          {tr.varies_per_day && tr.per_day_times && Object.keys(tr.per_day_times).length > 0 && (
            <Row label="TIJDEN PER DAG" value={
              Object.entries(tr.per_day_times).map(([day, time]) => `${day.toUpperCase()}: ${timeLabels[time] || time}`).join(' · ')
            } isMobile={isMobile} />
          )}
        </>
      )}

      {/* ── SCHEMA ── */}
      <Label text="MAALTIJDSCHEMA" />
      <StatBar isMobile={isMobile} stats={[
        { label: 'MAALTIJDEN', value: cd.meals_per_day || np?.meal_schedule?.num_meals || '—', unit: '/dag' },
        { label: 'VARIATIE', value: cd.variety_preference || '—' }
      ]} />
      {np?.meal_schedule?.custom_adjustments && (
        <Row label="AANPASSINGEN" value={np.meal_schedule.custom_adjustments} isMobile={isMobile} />
      )}

      {/* ── ALLERGIEËN ── */}
      {hasAlerts && (
        <div style={{ borderLeft: `3px solid ${C.red}` }}>
          <Label text="ALLERGIEËN & DIEET" color={C.red} />
          {al.diet_preference && al.diet_preference !== 'geen' && (
            <Row label="DIEET" value={al.diet_preference} color={C.amber} isMobile={isMobile} />
          )}
          {al.selected_allergens?.length > 0 && (
            <Row label="ALLERGIEËN" value={al.selected_allergens.join(', ')} color={C.red} isMobile={isMobile} />
          )}
          {al.custom_allergens && (
            <Row label="OVERIGE" value={al.custom_allergens} color={C.red} isMobile={isMobile} />
          )}
          {cd.allergies && !al.selected_allergens?.length && <Row label="ALLERGIEËN" value={cd.allergies} color={C.red} isMobile={isMobile} />}
          {cd.intolerances && <Row label="INTOLERANTIES" value={cd.intolerances} color={C.amber} isMobile={isMobile} />}
        </div>
      )}

      {/* ── VOEDSELVOORKEUREN (loved/hated legacy) ── */}
      {(cd.loved_foods || cd.hated_foods) && (
        <>
          <Label text="VOEDSELVOORKEUREN" />
          {cd.loved_foods && <Row label="FAVORIETEN" value={cd.loved_foods} color={C.green} isMobile={isMobile} />}
          {cd.hated_foods && <Row label="HAAT" value={cd.hated_foods} color={C.red} isMobile={isMobile} />}
        </>
      )}

      {/* ── INGREDIËNT CATEGORIEËN (incl. vegetable_preferences) ── */}
      {gl !== 'free' && (
        <>
          {catsWithChanges.length > 0 && <Label text="INGREDIËNT WIJZIGINGEN" />}
          {catsWithChanges.map(cat => (
            <PrefRow key={cat.key} label={cat.label} standard={cat.standard}
              removals={getRemovals(cat.key)} additions={getAdditions(cat.key)} isMobile={isMobile} />
          ))}
          {catsStandard.length > 0 && (
            <>
              <button onClick={() => toggle('stdCats')} style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0.3rem 0.75rem', background: 'transparent', border: 'none',
                borderBottom: `1px solid ${C.borderSub}`, cursor: 'pointer',
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent'
              }}>
                <span style={{ fontSize: '0.55rem', fontWeight: 600, color: C.text25 }}>
                  {catsStandard.length} categorie{catsStandard.length > 1 ? 'ën' : ''} standaard geaccepteerd
                </span>
                {expandedSections.stdCats ? <ChevronDown size={11} color={C.text25} /> : <ChevronRight size={11} color={C.text25} />}
              </button>
              {expandedSections.stdCats && catsStandard.map(cat => (
                <PrefRow key={cat.key} label={cat.label} standard={cat.standard} removals={[]} additions={[]} isMobile={isMobile} />
              ))}
            </>
          )}
        </>
      )}

      {/* ── SUPPLEMENTEN ── */}
      {sp.openness && (
        <>
          <Label text="SUPPLEMENTEN" />
          <StatBar isMobile={isMobile} stats={[
            { label: 'OPENHEID', value: suppOpennessLabels[sp.openness] || sp.openness },
            { label: 'BUDGET', value: (sp.budget || sp.supp_budget) ? `€${sp.budget || sp.supp_budget}/mnd` : '—' }
          ]} />
          {/* current_supplements[] — nieuw veld */}
          {(sp.current_supplements?.length > 0 || sp.current_supps) && (
            <Row label="NEEMT NU"
              value={sp.current_supplements?.length > 0
                ? sp.current_supplements.join(', ')
                : sp.current_supps}
              isMobile={isMobile} />
          )}
          {sp.recommended_removals?.length > 0 && (
            <Row label="NIET GEWENST" value={sp.recommended_removals.join(', ')} color={C.red} isMobile={isMobile} />
          )}
          {sp.notes && <Row label="OPMERKING" value={sp.notes} isMobile={isMobile} />}
        </>
      )}
      {/* Legacy supplement format */}
      {!sp.openness && sp.standard_list && (
        <>
          <Label text="SUPPLEMENTEN" />
          <PrefRow label="SUPPS" standard={sp.standard_list} removals={sp.removals || []} additions={sp.additions || []} isMobile={isMobile} />
        </>
      )}

      {/* ── CHEAT MEALS — incl. social_frequency + social_types ── */}
      {cm.frequency && (
        <>
          <Label text="FLEXIBEL ETEN" />
          <StatBar isMobile={isMobile} stats={[
            { label: 'FREQUENTIE', value: cheatFreqLabels[cm.frequency] || cm.frequency },
            { label: 'AANPAK', value: cheatApproachLabels[cm.approach] || cm.approach || '—' },
            cm.social_frequency ? { label: 'SOCIAAL', value: cm.social_frequency } : null
          ].filter(Boolean)} />
          {cm.social_types?.length > 0 && (
            <Row label="SOCIALE SITUATIES" value={cm.social_types.join(', ')} isMobile={isMobile} />
          )}
          {/* Legacy */}
          {cm.social_situations && !cm.social_types?.length && (
            <Row label="SOCIAAL" value={cm.social_situations} isMobile={isMobile} />
          )}
        </>
      )}

      {/* ── WENSEN — incl. priority_ranking ── */}
      {(wi.desired_ingredients || wi.absolute_no || wi.coach_notes || wi.current_eating || wi.favorite_meals || wi.expectations || wi.most_important || wi.general_notes || wi.priority_ranking?.length > 0) && (
        <>
          <Label text="WENSEN & OPMERKINGEN" />
          {wi.desired_ingredients && <Row label="WIL GRAAG" value={wi.desired_ingredients} color={C.green} isMobile={isMobile} />}
          {wi.absolute_no && <Row label="ABSOLUUT NIET" value={wi.absolute_no} color={C.red} isMobile={isMobile} />}
          {wi.coach_notes && <Row label="VOOR COACH" value={wi.coach_notes} isMobile={isMobile} />}
          {wi.most_important && (
            <Row label="PRIORITEIT" value={priorityLabels[wi.most_important] || wi.most_important} color={C.gold} isMobile={isMobile} />
          )}
          {/* priority_ranking[] — nieuw veld */}
          {wi.priority_ranking?.length > 0 && (
            <div style={{ padding: '0.2rem 0.75rem', borderBottom: `1px solid ${C.borderFaint}` }}>
              <span style={{ fontSize: '0.4rem', fontWeight: 700, color: C.text25, textTransform: 'uppercase', letterSpacing: '0.05em' }}>PRIORITEITSRANGSCHIKKING</span>
              <div style={{ display: 'flex', gap: '0.2rem', flexWrap: 'wrap', marginTop: '0.1rem' }}>
                {wi.priority_ranking.map((p, i) => (
                  <span key={i} style={{
                    fontSize: isMobile ? '0.55rem' : '0.6rem', fontWeight: 700,
                    padding: '0.06rem 0.25rem',
                    background: 'rgba(255,215,0,0.06)', border: '1px solid rgba(255,215,0,0.15)',
                    color: i === 0 ? C.gold : C.text25
                  }}>{i + 1}. {priorityLabels[p] || p}</span>
                ))}
              </div>
            </div>
          )}
          {wi.general_notes && <Row label="OPMERKING" value={wi.general_notes} isMobile={isMobile} />}
          {wi.current_eating && <Row label="HUIDIG EETPATROON" value={wi.current_eating} isMobile={isMobile} />}
          {wi.favorite_meals && <Row label="FAVORIETE MAALTIJDEN" value={wi.favorite_meals} color={C.green} isMobile={isMobile} />}
          {wi.expectations && <Row label="VERWACHTINGEN" value={wi.expectations} isMobile={isMobile} />}
        </>
      )}

      {/* ── PRAKTISCH (legacy) ── */}
      {prac && (prac.breakfast_location || prac.cooking_preference) && !lc.work_situation && (
        <>
          <Label text="PRAKTISCH (OUD)" />
          <StatBar isMobile={isMobile} stats={[
            { label: 'KOKEN', value: cookLabels[prac.cooking_preference] || cd.cooking_skill || '—' },
            { label: 'KOOKTIJD', value: cd.cooking_time ? `${cd.cooking_time}min` : '—' },
            { label: 'BUDGET', value: cd.budget_per_week ? `€${cd.budget_per_week}` : '—', unit: '/wk' }
          ]} />
          <StatBar isMobile={isMobile} stats={[
            { label: 'ONTBIJT', value: prac.breakfast_location || '—' },
            { label: 'LUNCH', value: prac.lunch_location || '—' },
            { label: 'DINER', value: prac.dinner_location || '—' }
          ]} />
        </>
      )}

      {/* Next */}
      <div style={{ padding: isMobile ? '0.75rem' : '1rem' }}>
        <button onClick={onNext} style={{
          width: '100%', padding: '0.625rem',
          background: `linear-gradient(90deg, ${C.green}, #059669)`,
          border: 'none', borderRadius: 0, color: '#000',
          fontSize: isMobile ? '0.75rem' : '0.85rem', fontWeight: 800,
          cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          minHeight: '44px'
        }}>DATA BEKEKEN → EETPATROON BESPREKEN</button>
      </div>
    </div>
  )
}

function Label({ text, color }) {
  return (
    <div style={{ padding: '0.4rem 0.75rem 0.15rem', fontSize: '0.4rem', fontWeight: 700, color: color || C.text25, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{text}</div>
  )
}

function Row({ label, value, color, isMobile }) {
  if (!value) return null
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '0.2rem 0.75rem', borderBottom: `1px solid ${C.borderFaint}`, gap: '0.5rem' }}>
      <span style={{ fontSize: '0.4rem', fontWeight: 700, color: C.text25, textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: isMobile ? '0.7rem' : '0.75rem', fontWeight: 700, color: color || C.text50, textAlign: 'right', maxWidth: '70%', lineHeight: 1.3 }}>{value}</span>
    </div>
  )
}

function PrefRow({ label, standard, removals, additions, isMobile }) {
  const hasChanges = removals.length > 0 || additions.length > 0
  return (
    <div style={{ padding: '0.25rem 0.75rem', borderBottom: `1px solid ${C.borderSub}` }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.1rem' }}>
        <span style={{ fontSize: '0.4rem', fontWeight: 700, color: C.text25, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
        {!hasChanges && <span style={{ fontSize: '0.4rem', color: C.text25 }}>standaard</span>}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.15rem' }}>
        {standard.map(item => {
          const removed = removals.some(r => {
            const rLower = (typeof r === 'string' ? r : '').toLowerCase()
            const iLower = item.toLowerCase()
            return rLower.includes(iLower) || iLower.includes(rLower) || rLower === iLower
          })
          return (
            <span key={item} style={{
              fontSize: isMobile ? '0.55rem' : '0.6rem', fontWeight: 600,
              padding: '0.08rem 0.25rem',
              background: removed ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.02)',
              border: `1px solid ${removed ? 'rgba(239,68,68,0.2)' : C.borderFaint}`,
              color: removed ? C.red : 'rgba(255,255,255,0.3)',
              textDecoration: removed ? 'line-through' : 'none'
            }}>{item}</span>
          )
        })}
        {additions.map(item => (
          <span key={item} style={{
            fontSize: isMobile ? '0.55rem' : '0.6rem', fontWeight: 700,
            padding: '0.08rem 0.25rem',
            background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
            color: C.green
          }}>+ {item}</span>
        ))}
      </div>
    </div>
  )
}
